import Capacitor
import Security

@objc public class SecureStoragePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "SecureStoragePlugin"
    public let jsName = "SecureStorage"

    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "storeData", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getData", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "removeData", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clearStorage", returnType: CAPPluginReturnPromise)
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
            kSecAttrAccount: id
        ]

        let attributesToUpdate: [CFString: Any] = [
            kSecValueData: data
        ]

        var status = SecItemUpdate(keychainQuery as CFDictionary, attributesToUpdate as CFDictionary)

        if status == errSecItemNotFound {
            var addQuery = keychainQuery
            addQuery[kSecValueData] = data
            addQuery[kSecAttrAccessible] = kSecAttrAccessibleWhenUnlockedThisDeviceOnly
            status = SecItemAdd(addQuery as CFDictionary, nil)
        }

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

    @objc func removeData(_ call: CAPPluginCall) {
        guard let id = call.getString("id") else {
            call.reject("Missing required parameter: id")
            return
        }

        let keychainQuery: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrAccount: id
        ]

        let status = SecItemDelete(keychainQuery as CFDictionary)

        if status == errSecSuccess || status == errSecItemNotFound {
            call.resolve()
        } else {
            call.reject("Error removing data: \(status)")
        }
    }

    @objc func clearStorage(_ call: CAPPluginCall) {
        let keychainQuery: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword
        ]

        let status = SecItemDelete(keychainQuery as CFDictionary)

        if status == errSecSuccess || status == errSecItemNotFound {
            call.resolve()
        } else {
            call.reject("Error clearing storage: \(status)")
        }
    }
}
