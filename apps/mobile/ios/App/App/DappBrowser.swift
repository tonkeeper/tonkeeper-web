import Capacitor
import WebKit

class InteractionRouterView: UIView {
    weak var mainView: UIView?
    weak var browserView: UIView?
    var passthroughTopHeight: CGFloat = 0
    var passthroughBottomHeight: CGFloat = 0
    var focusDappView: Bool = false

    override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
        let height = self.bounds.height

        if !focusDappView {
            return mainView?.hitTest(convert(point, to: mainView), with: event)
        }

        if point.y <= passthroughTopHeight || point.y >= height - passthroughBottomHeight {
            return mainView?.hitTest(convert(point, to: mainView), with: event)
        }

        return browserView?.hitTest(convert(point, to: browserView), with: event)
    }
}

@objc public class DappBrowserPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "DappBrowserPlugin"
    public let jsName = "DappBrowser"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "open", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "hide", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "show", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "close", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "sendToBrowser", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setIsMainViewInFocus", returnType: CAPPluginReturnPromise)
    ]

    private var webViews: [String: WKWebView] = [:]
    private var routerView: InteractionRouterView?

    @objc func open(_ call: CAPPluginCall) {
        guard let id = call.getString("id"),
              let urlStr = call.getString("url"),
              let url = URL(string: urlStr) else {
            call.reject("Missing or invalid 'id' or 'url'")
            return
        }

        let topOffset = CGFloat(call.getInt("topOffset") ?? 0)
        let bottomOffset = CGFloat(call.getInt("bottomOffset") ?? 0)

        DispatchQueue.main.async {
            if let existingWebView = self.webViews[id] {
                existingWebView.isHidden = false
                self._configureRouter(top: topOffset, bottom: bottomOffset, browserView: existingWebView, focusDappView: true)
                call.resolve()
                return
            }

            let contentController = WKUserContentController()
            contentController.add(self, name: "browserMessages")

            if let jsPath = Bundle.main.path(forResource: "injected", ofType: "js"),
               let jsSource = try? String(contentsOfFile: jsPath) {
                let userScript = WKUserScript(source: jsSource, injectionTime: .atDocumentStart, forMainFrameOnly: true)
                contentController.addUserScript(userScript)
            }

            let config = WKWebViewConfiguration()
            config.allowsInlineMediaPlayback = true
            config.mediaTypesRequiringUserActionForPlayback = []
            config.userContentController = contentController

            let webView = WKWebView(frame: self.bridge?.viewController?.view.bounds ?? .zero, configuration: config)
            webView.translatesAutoresizingMaskIntoConstraints = false
            webView.backgroundColor = .clear
            webView.isOpaque = false
            webView.scrollView.bounces = false
            webView.scrollView.alwaysBounceVertical = false
            webView.scrollView.alwaysBounceHorizontal = false
            webView.scrollView.contentInsetAdjustmentBehavior = .never
            webView.load(URLRequest(url: url))

            if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
               let rootView = windowScene.windows.first { // root view is UIWindow
               rootView.insertSubview(webView, at: 0)

               NSLayoutConstraint.activate([
                   webView.topAnchor.constraint(equalTo: rootView.topAnchor, constant: topOffset),
                   webView.bottomAnchor.constraint(equalTo: rootView.bottomAnchor),
                   webView.leadingAnchor.constraint(equalTo: rootView.leadingAnchor),
                   webView.trailingAnchor.constraint(equalTo: rootView.trailingAnchor),
               ])

                self.webViews[id] = webView
                self._configureRouter(top: topOffset, bottom: bottomOffset, browserView: webView, focusDappView: true)
                call.resolve()
            } else {
               call.reject("Failed to obtain root view or main WebView")
           }
        }
    }

    @objc func hide(_ call: CAPPluginCall) {
        guard let id = call.getString("id"),
              let webView = webViews[id] else {
            call.reject("No WebView with id '\(call.getString("id") ?? "")'")
            return
        }

        DispatchQueue.main.async {
            webView.isHidden = true
            self.routerView?.focusDappView = false
            call.resolve()
        }
    }

    @objc func show(_ call: CAPPluginCall) {
        guard let id = call.getString("id"),
              let webView = webViews[id] else {
            call.reject("No WebView with id '\(call.getString("id") ?? "")'")
            return
        }

        DispatchQueue.main.async {
            webView.isHidden = false
            self.routerView?.focusDappView = true
            call.resolve()
        }
    }

    @objc func close(_ call: CAPPluginCall) {
        guard let id = call.getString("id"),
              let webView = webViews[id] else {
            call.reject("No WebView with id '\(call.getString("id") ?? "")'")
            return
        }

        DispatchQueue.main.async {
            webView.removeFromSuperview()
            self.webViews.removeValue(forKey: id)
            self.routerView?.focusDappView = false
            call.resolve()
        }
    }

    @objc func sendToBrowser(_ call: CAPPluginCall) {
        guard let webViewId = call.getString("webViewId"),
              let payload = call.getString("payload"),
              let webView = webViews[webViewId] else {
            call.reject("Missing parameters or WebView")
            return
        }

        let queryId = call.getString("queryId")

        var detailDict: [String: Any] = [
            "webViewId": webViewId,
            "payload": payload
        ]
        if let queryId = queryId {
            detailDict["queryId"] = queryId
        }

        guard let detailData = try? JSONSerialization.data(withJSONObject: detailDict, options: []),
              let detailJson = String(data: detailData, encoding: .utf8) else {
            call.reject("Failed to serialize payload")
            return
        }

        let js = "window.dispatchEvent(new CustomEvent(\"mainMessageReceived\", { detail: \(detailJson) }))"

        DispatchQueue.main.async {
            webView.evaluateJavaScript(js)
            call.resolve()
        }
    }

    @objc func setIsMainViewInFocus(_ call: CAPPluginCall) {
        guard let focus = call.getBool("focus") else {
            call.reject("Missing 'enabled' boolean parameter")
            return
        }

        DispatchQueue.main.async {
            self.routerView?.focusDappView = !focus
            call.resolve()
        }
    }

    func _configureRouter(top: CGFloat, bottom: CGFloat, browserView: WKWebView, focusDappView: Bool) {
        guard let window = UIApplication.shared
                .connectedScenes
                .compactMap({ $0 as? UIWindowScene })
                .flatMap({ $0.windows })
                .first(where: { $0.isKeyWindow }),
              let mainView = self.bridge?.webView else {
            return
        }

        if self.routerView == nil {
            let router = InteractionRouterView(frame: window.bounds)
            router.mainView = mainView
            router.browserView = browserView
            router.passthroughTopHeight = top
            router.passthroughBottomHeight = bottom
            router.focusDappView = focusDappView
            router.autoresizingMask = [.flexibleWidth, .flexibleHeight]
            router.backgroundColor = .clear
            window.addSubview(router)
            self.routerView = router
        } else {
            routerView?.mainView = mainView
            routerView?.browserView = browserView
            routerView?.passthroughTopHeight = top
            routerView?.passthroughBottomHeight = bottom
            routerView?.focusDappView = focusDappView
        }
    }
}

extension DappBrowserPlugin: WKScriptMessageHandler {
    public func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "browserMessages" else { return }

        guard let body = message.body as? [String: Any],
              let queryId = body["queryId"] as? String,
              let payload = body["payload"] as? String,
              let webview = message.webView,
              let webViewId = self.webViews.first(where: { $0.value == webview })?.key else {
            return
        }

        webview.evaluateJavaScript("window.location.origin") { result, error in
            let origin = (result as? String) ?? "unknown"

            self.notifyListeners("browserMessageReceived", data: [
                "webViewId": webViewId,
                "queryId": queryId,
                "payload": payload,
                "webViewOrigin": origin
            ])
        }
    }
}
