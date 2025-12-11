import Capacitor
import Security

@objc public class DeviceStoragePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "DeviceStoragePlugin"
    public let jsName = "DeviceStorage"

    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "get", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "set", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setBatch", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "delete", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clear", returnType: CAPPluginReturnPromise)
    ]

    private let servicePrefix = "com.tonapps.tonkeeperpro.device."

    private func _get(key: String) -> (value: String?, error: String?) {
        let keychainQuery: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrService: servicePrefix,
            kSecAttrAccount: key,
            kSecReturnData: true,
            kSecMatchLimit: kSecMatchLimitOne
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(keychainQuery as CFDictionary, &result)

        if status == errSecSuccess, let data = result as? Data, let stringData = String(data: data, encoding: .utf8) {
            return (stringData, nil)
        } else if status == errSecItemNotFound {
            return (nil, nil)
        } else {
            return (nil, "Error retrieving data: \(status)")
        }
    }

    private func _set(key: String, value: String) -> (success: Bool, error: String?) {
        guard let data = value.data(using: .utf8) else {
            return (false, "Failed to encode value as UTF-8")
        }

        let keychainQuery: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrService: servicePrefix,
            kSecAttrAccount: key
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
            return (true, nil)
        } else {
            return (false, "Error storing data: \(status)")
        }
    }

    @objc func get(_ call: CAPPluginCall) {
        guard let key = call.getString("key") else {
            call.reject("Missing required parameter: key")
            return
        }

        let result = _get(key: key)

        if let error = result.error {
            call.reject(error)
        } else if let value = result.value {
            call.resolve([
                "value": value
            ])
        } else {
            call.resolve([
                "value": NSNull()
            ])
        }
    }

    @objc func set(_ call: CAPPluginCall) {
        guard let key = call.getString("key"),
              let value = call.getString("value") else {
            call.reject("Missing required parameters: key and value")
            return
        }

        let result = _set(key: key, value: value)

        if result.success {
            call.resolve([
                "value": value
            ])
        } else {
            call.reject(result.error ?? "Unknown error")
        }
    }

    @objc func setBatch(_ call: CAPPluginCall) {
        guard let values = call.getObject("values") as? [String: String] else {
            call.reject("Missing required parameter: values")
            return
        }

        var errors: [String] = []
        var results: [String: String] = [:]

        for (key, value) in values {
            let result = _set(key: key, value: value)

            if result.success {
                results[key] = value
            } else {
                errors.append("Error storing data for key '\(key)': \(result.error ?? "Unknown error")")
            }
        }

        if errors.isEmpty {
            call.resolve([
                "values": results
            ])
        } else {
            call.reject("Batch operation failed: \(errors.joined(separator: ", "))")
        }
    }

    @objc func delete(_ call: CAPPluginCall) {
        guard let key = call.getString("key") else {
            call.reject("Missing required parameter: key")
            return
        }

        let getResult = _get(key: key)

        let deleteQuery: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrService: servicePrefix,
            kSecAttrAccount: key
        ]

        let deleteStatus = SecItemDelete(deleteQuery as CFDictionary)

        if deleteStatus == errSecSuccess || deleteStatus == errSecItemNotFound {
            if let value = getResult.value {
                call.resolve([
                    "value": value
                ])
            } else {
                call.resolve([
                    "value": NSNull()
                ])
            }
        } else {
            call.reject("Error removing data: \(deleteStatus)")
        }
    }

    @objc func clear(_ call: CAPPluginCall) {
        let keychainQuery: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrService: servicePrefix
        ]

        let status = SecItemDelete(keychainQuery as CFDictionary)

        if status == errSecSuccess || status == errSecItemNotFound {
            call.resolve()
        } else {
            call.reject("Error clearing storage: \(status)")
        }
    }
}
