import Capacitor
import WebKit

@objc public class DappBrowserPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "DappBrowserPlugin"
    public let jsName = "DappBrowser"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "open", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "hide", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "show", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "close", returnType: CAPPluginReturnPromise)
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

            let config = WKWebViewConfiguration()
            config.allowsInlineMediaPlayback = true
            config.mediaTypesRequiringUserActionForPlayback = []

            let webView = WKWebView(frame: self.bridge?.viewController?.view.bounds ?? .zero, configuration: config)
            webView.translatesAutoresizingMaskIntoConstraints = false
            webView.backgroundColor = .clear
            webView.isOpaque = false
            webView.scrollView.bounces = false
            webView.scrollView.alwaysBounceVertical = false
            webView.scrollView.alwaysBounceHorizontal = false
            webView.scrollView.contentInsetAdjustmentBehavior = .never
            webView.load(URLRequest(url: url))

            if let rootView = self.bridge?.viewController?.view,
               let mainWebView = self.bridge?.webView {
                rootView.insertSubview(webView, belowSubview: mainWebView)

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
}
