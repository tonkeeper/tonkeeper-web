import Foundation
import Capacitor
import UIKit

@objc public class DeepLinkPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "DeepLinkPlugin"
    public let jsName = "DeepLink"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "canOpen", returnType: CAPPluginReturnPromise)
    ]

    @objc func canOpen(_ call: CAPPluginCall) {
        guard let urlString = call.getString("url"),
              let url = URL(string: urlString) else {
            call.reject("URL is required")
            return
        }

        if !UIApplication.shared.canOpenURL(url) {
            call.resolve(["value": false])
            return
        }

        if let bundleURLTypes = Bundle.main.infoDictionary?["CFBundleURLTypes"] as? [[String: Any]],
           bundleURLTypes.contains(where: { dict in
               if let schemes = dict["CFBundleURLSchemes"] as? [String] {
                   return schemes.contains(url.scheme ?? "")
               }
               return false
           }) {
            call.reject("Current app supports this deep link")
            return
        }

        call.resolve(["value": true])
    }
}
