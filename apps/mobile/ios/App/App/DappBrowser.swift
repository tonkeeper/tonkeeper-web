import Capacitor
import WebKit

@objc public class DappBrowserPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "DappBrowserPlugin"
    public let jsName = "DappBrowser"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "open", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "hide", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "show", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "close", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "sendToBrowser", returnType: CAPPluginReturnPromise)
    ]

    private var webViews: [String: WKWebView] = [:]

    @objc func open(_ call: CAPPluginCall) {
        guard let id = call.getString("id"),
              let urlStr = call.getString("url"),
              let url = URL(string: urlStr) else {
            call.reject("Missing or invalid 'id' or 'url'")
            return
        }

        let topOffset = CGFloat(call.getInt("topOffset") ?? 0)

        DispatchQueue.main.async {
            if let existingWebView = self.webViews[id] {
                existingWebView.isHidden = false
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
