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

            var storeCountry: String? = nil
            if #available(iOS 13.0, *) {
                storeCountry = SKPaymentQueue.default().storefront?.countryCode
            }

            call.resolve([
                "deviceCountryCode": deviceCountry ?? NSNull(),
                "storeCountryCode": storeCountry ?? NSNull()
            ])
        }
}
