import Capacitor
import Security

@objc public class SecureStoragePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "SecureStoragePlugin"
    public let jsName = "SecureStorage"

    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "storeData", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getData", returnType: CAPPluginReturnPromise)
    ]


    @objc func storeData(_ call: CAPPluginCall) {
        guard let id = call.getString("id"),
           let dataString = call.getString("data"),
           let data = dataString.data(using: .utf8) else {
             call.reject("Missing required parameters")
             return
        }

        let keychainQuery: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrAccessible: kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
            kSecAttrAccount: id,
            kSecValueData: data
        ]

        SecItemDelete(keychainQuery as CFDictionary)


        let status = SecItemAdd(keychainQuery as CFDictionary, nil)

        if status == errSecSuccess {
            call.resolve()
        } else {
            call.reject("Error storing data: \(status)")
        }
    }


    @objc func getData(_ call: CAPPluginCall) {
        guard let id = call.getString("id") else {
            call.reject("Missing required parameter: id")
            return
        }

        let keychainQuery: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrAccount: id,
            kSecReturnData: true,
            kSecMatchLimit: kSecMatchLimitOne
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(keychainQuery as CFDictionary, &result)

        if status == errSecSuccess, let data = result as? Data, let stringData = String(data: data, encoding: .utf8) {
            call.resolve([
                "data": stringData
            ])
        } else {
            call.reject("Error retrieving data: \(status)")
        }
    }
}
