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

    private let servicePrefix = "com.tonkeeper.keychain."

    @objc func get(_ call: CAPPluginCall) {
        guard let key = call.getString("key") else {
            call.reject("Missing required parameter: key")
            return
        }

        let keychainQuery: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrService: servicePrefix + key,
            kSecReturnData: true,
            kSecMatchLimit: kSecMatchLimitOne,
            kSecAttrAccessible: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(keychainQuery as CFDictionary, &result)

        if status == errSecSuccess, let data = result as? Data {
            do {
                let jsonObject = try JSONSerialization.jsonObject(with: data, options: [])
                call.resolve([
                    "value": jsonObject
                ])
            } catch {
                call.reject("Failed to deserialize JSON: \(error.localizedDescription)")
            }
        } else if status == errSecItemNotFound {
            call.resolve([
                "value": NSNull()
            ])
        } else {
            call.reject("Error retrieving data: \(status)")
        }
    }

    @objc func set(_ call: CAPPluginCall) {
        guard let key = call.getString("key") else {
            call.reject("Missing required parameters: key and value")
            return
        }

        let value = call.getValue("value")
        let jsonData: Data

        do {
            jsonData = try JSONSerialization.data(withJSONObject: value as Any, options: [])
        } catch {
            call.reject("Failed to serialize value to JSON: \(error.localizedDescription)")
            return
        }

        let keychainQuery: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrService: servicePrefix + key,
            kSecAttrAccessible: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]

        let attributesToUpdate: [CFString: Any] = [
            kSecValueData: jsonData
        ]

        var status = SecItemUpdate(keychainQuery as CFDictionary, attributesToUpdate as CFDictionary)

        if status == errSecItemNotFound {
            var addQuery = keychainQuery
            addQuery[kSecValueData] = jsonData
            status = SecItemAdd(addQuery as CFDictionary, nil)
        }

        if status == errSecSuccess {
            call.resolve([
                "value": value
            ])
        } else {
            call.reject("Error storing data: \(status)")
        }
    }

    @objc func setBatch(_ call: CAPPluginCall) {
        guard let values = call.getObject("values") as? [String: Any] else {
            call.reject("Missing required parameter: values")
            return
        }

        var errors: [String] = []
        var results: [String: Any] = [:]

        for (key, value) in values {
            let jsonData: Data
            do {
                jsonData = try JSONSerialization.data(withJSONObject: value, options: [])
            } catch {
                errors.append("Failed to serialize value for key '\(key)' to JSON: \(error.localizedDescription)")
                continue
            }

            let keychainQuery: [CFString: Any] = [
                kSecClass: kSecClassGenericPassword,
                kSecAttrService: servicePrefix + key,
                kSecAttrAccessible: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
            ]

            let attributesToUpdate: [CFString: Any] = [
                kSecValueData: jsonData
            ]

            var status = SecItemUpdate(keychainQuery as CFDictionary, attributesToUpdate as CFDictionary)

            if status == errSecItemNotFound {
                var addQuery = keychainQuery
                addQuery[kSecValueData] = jsonData
                status = SecItemAdd(addQuery as CFDictionary, nil)
            }

            if status == errSecSuccess {
                results[key] = value
            } else {
                errors.append("Error storing data for key '\(key)': \(status)")
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

        // First get the current value
        let getQuery: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrService: servicePrefix + key,
            kSecReturnData: true,
            kSecMatchLimit: kSecMatchLimitOne,
            kSecAttrAccessible: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]

        var result: AnyObject?
        let getStatus = SecItemCopyMatching(getQuery as CFDictionary, &result)

        var previousValue: Any? = nil
        if getStatus == errSecSuccess, let data = result as? Data {
            do {
                previousValue = try JSONSerialization.jsonObject(with: data, options: [])
            } catch {
                // If JSON deserialization fails, return null
                previousValue = nil
            }
        }

        // Delete the item
        let deleteQuery: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrService: servicePrefix + key,
            kSecAttrAccessible: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]

        let deleteStatus = SecItemDelete(deleteQuery as CFDictionary)

        if deleteStatus == errSecSuccess || deleteStatus == errSecItemNotFound {
            if let value = previousValue {
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
            kSecAttrAccessible: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]

        var getAllQuery = keychainQuery
        getAllQuery[kSecReturnAttributes] = true
        getAllQuery[kSecMatchLimit] = kSecMatchLimitAll

        var result: AnyObject?
        let getStatus = SecItemCopyMatching(getAllQuery as CFDictionary, &result)

        if getStatus == errSecSuccess, let items = result as? [[CFString: Any]] {
            for item in items {
                if let service = item[kSecAttrService] as? String,
                   service.hasPrefix(servicePrefix) {
                    let deleteQuery: [CFString: Any] = [
                        kSecClass: kSecClassGenericPassword,
                        kSecAttrService: service,
                        kSecAttrAccessible: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
                    ]
                    SecItemDelete(deleteQuery as CFDictionary)
                }
            }
        }

        call.resolve()
    }
}
