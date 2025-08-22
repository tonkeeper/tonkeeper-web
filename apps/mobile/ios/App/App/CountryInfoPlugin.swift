import Foundation
import Capacitor
import StoreKit

@objc public class CountryInfoPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "CountryInfoPlugin"
    public let jsName = "CountryInfo"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getInfo", returnType: CAPPluginReturnPromise)
    ]

    @objc func getInfo(_ call: CAPPluginCall) {
        var deviceCountry: String? = nil
        if #available(iOS 16.0, *) {
            deviceCountry = Locale.current.region?.identifier
        } else {
            deviceCountry = (Locale.current as NSLocale).object(forKey: .countryCode) as? String
        }

        func finish(_ storeCode: String?) {
            call.resolve([
                "deviceCountryCode": deviceCountry ?? NSNull(),
                "storeCountryCode": storeCode ?? NSNull()
            ])
        }

        if #available(iOS 15.0, *) {
            Task {
                let storeCode = await Storefront.current?.countryCode
                finish(storeCode)
            }
        } else {
            finish(nil)
        }
    }
}
