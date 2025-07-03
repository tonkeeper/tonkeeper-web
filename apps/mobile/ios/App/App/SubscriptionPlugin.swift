import Foundation
import StoreKit
import Capacitor

@objc public class SubscriptionPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "SubscriptionPlugin"
    public let jsName = "Subscription"

    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getProductInfo", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getAllProductsInfo", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "subscribe", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getOriginalTransactionId", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "manageSubscriptions", returnType: CAPPluginReturnPromise)
    ]

    @objc public func getProductInfo(_ call: CAPPluginCall) {
        guard let productId = call.getString("productId") else {
            call.reject("Missing productId")
            return
        }

        guard #available(iOS 15.0, *) else {
            call.reject("iOS 15+ required")
            return
        }

        Task {
            do {
                let products = try await Product.products(for: [productId])
                guard let product = products.first else {
                    call.reject("Product not found")
                    return
                }

                let environment = await getEnvironment()
                var productDict = productToDict(product)
                productDict["environment"] = environment
                call.resolve(productDict)
            } catch {
                call.reject("Failed to load product: \(error.localizedDescription)")
            }
        }
    }

    @objc public func getAllProductsInfo(_ call: CAPPluginCall) {
        guard let productIds = call.getArray("productIds", String.self) else {
            call.reject("Missing productIds")
            return
        }

        guard #available(iOS 15.0, *) else {
            call.reject("iOS 15+ required")
            return
        }

        Task {
            do {
                let products = try await Product.products(for: productIds)
                let environment = await getEnvironment()
                let result = products.map { product -> [String: Any] in
                    var dict = productToDict(product)
                    dict["environment"] = environment
                    return dict
                }
                call.resolve(["products": result])
            } catch {
                call.reject("Failed to load products: \(error.localizedDescription)")
            }
        }
    }

    @objc public func subscribe(_ call: CAPPluginCall) {
        guard let productId = call.getString("productId") else {
            call.reject("Missing productId")
            return
        }

        guard #available(iOS 15.0, *) else {
            call.reject("iOS 15+ required")
            return
        }

        Task {
            do {
                let products = try await Product.products(for: [productId])
                guard let product = products.first else {
                    call.reject("Product not found")
                    return
                }

                let result = try await product.purchase()

                switch result {
                case .success(let verification):
                    switch verification {
                    case .verified(let transaction):
                        await transaction.finish()
                        var response: [String: Any] = [
                            "status": "success",
                            "originalTransactionId": transaction.originalID
                        ]
                        if #available(iOS 16.0, *) {
                            response["environment"] = transaction.environment.rawValue
                        } else {
                            response["environment"] = NSNull()
                        }
                        call.resolve(response)
                    case .unverified(_, let error):
                        call.reject("Purchase unverified: \(error.localizedDescription)")
                    }
                case .userCancelled:
                    call.resolve(["status": "cancelled", "environment": NSNull()])
                case .pending:
                    call.resolve(["status": "pending", "environment": NSNull()])
                @unknown default:
                    call.reject("Unknown purchase state")
                }
            } catch {
                call.reject("Purchase failed: \(error.localizedDescription)")
            }
        }
    }

    @objc public func getOriginalTransactionId(_ call: CAPPluginCall) {
        guard #available(iOS 15.0, *) else {
            call.reject("iOS 15+ required")
            return
        }

        Task {
            for await result in Transaction.currentEntitlements {
                if case .verified(let transaction) = result {
                    var response: [String: Any] = [
                        "originalTransactionId": transaction.originalID,
                        "productId": transaction.productID,
                        "purchaseDate": ISO8601DateFormatter().string(from: transaction.purchaseDate)
                    ]
                    if #available(iOS 16.0, *) {
                        response["environment"] = transaction.environment.rawValue
                    } else {
                        response["environment"] = NSNull()
                    }
                    call.resolve(response)
                    return
                }
            }

            call.resolve(["originalTransactionId": NSNull(), "environment": NSNull()])
        }
    }

    @objc public func manageSubscriptions(_ call: CAPPluginCall) {
        guard #available(iOS 15.0, *) else {
            call.reject("iOS 15+ required")
            return
        }

        Task {
            do {
                guard let windowScene = await UIApplication.shared.connectedScenes
                    .first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene else {
                    call.reject("No active window scene")
                    return
                }

                try await AppStore.showManageSubscriptions(in: windowScene)
                call.resolve()
            } catch {
                call.reject("Failed to open subscription management: \(error.localizedDescription)")
            }
        }
    }

    @available(iOS 15.0, *)
    private func productToDict(_ product: Product) -> [String: Any] {
        let period = product.subscription?.subscriptionPeriod.unit
        let unitString: String

        switch period {
        case .day: unitString = "day"
        case .week: unitString = "week"
        case .month: unitString = "month"
        case .year: unitString = "year"
        default: unitString = "unknown"
        }

        return [
            "id": product.id,
            "displayName": product.displayName,
            "description": product.description,
            "displayPrice": product.displayPrice,
            "subscriptionGroup": product.subscription?.subscriptionGroupID ?? "",
            "subscriptionPeriod": unitString
        ]
    }

    @available(iOS 15.0, *)
    private func getEnvironment() async -> Any {
        for await result in Transaction.currentEntitlements {
            if case .verified(let transaction) = result {
                if #available(iOS 16.0, *) {
                    return transaction.environment.rawValue
                } else {
                    return NSNull()
                }
            }
        }
        return NSNull()
    }
}
