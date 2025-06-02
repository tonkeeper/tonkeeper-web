import UIKit
import Capacitor

class CustomViewController: CAPBridgeViewController {

    override func viewDidLoad() {
        super.viewDidLoad()

        // Do any additional setup after loading the view.
    }

    // Apply main webview transparency settings before load()
     override open func webView(with frame: CGRect, configuration: WKWebViewConfiguration) -> WKWebView {
            let wv = super.webView(with: frame, configuration: configuration)
            makeWebViewTransparent(wv)

            return wv
        }

    override open func capacitorDidLoad() {
        // Register plugins
        bridge?.registerPluginInstance(BiometricPlugin())
        bridge?.registerPluginInstance(SecureStoragePlugin())
        bridge?.registerPluginInstance(DeepLinkPlugin())
        bridge?.registerPluginInstance(BluetoothPlugin())
        bridge?.registerPluginInstance(DappBrowserPlugin())

        if let webView = self.bridge?.webView {
            makeWebViewTransparent(webView)
        }
    }

    func makeWebViewTransparent(_ webView: WKWebView) {
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.backgroundColor = .clear
        webView.scrollView.subviews.forEach { subview in
            subview.backgroundColor = .clear
            subview.layer.backgroundColor = UIColor.clear.cgColor
        }
    }

    /*
    // MARK: - Navigation

    // In a storyboard-based application, you will often want to do a little preparation before navigation
    override func prepare(for segue: UIStoryboardSegue, sender: Any?) {
        // Get the new view controller using segue.destination.
        // Pass the selected object to the new view controller.
    }
    */

}
