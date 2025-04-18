import Foundation
import LocalAuthentication
import Capacitor


@objc public class BiometricPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "BiometricPlugin"
    public let jsName = "Biometric"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "canPrompt", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "prompt", returnType: CAPPluginReturnPromise)
    ]

    
    @objc func canPrompt(_ call: CAPPluginCall) {
            var isAvailable = false;
            if #available(iOS 11, *) {
                let authContext = LAContext()

                let _ = authContext.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: nil)
                switch(authContext.biometryType) {
                case .none:
                    isAvailable = false;
                case .touchID:
                    isAvailable = true;
                case .faceID:
                    isAvailable = true;
                default:
                    isAvailable = false;
                }
            }
        
            call.resolve(["isAvailable": isAvailable])
        }

        @objc func prompt(_ call: CAPPluginCall) {
            let authContext = LAContext()

            authContext.touchIDAuthenticationAllowableReuseDuration = 60;

            let reason = call.getString("reason") ?? "Access requires authentication"

            authContext.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, localizedReason: reason ) { success, error in
                if success {
                    DispatchQueue.main.async {
                        call.resolve()
                    }
                } else {
                    call.reject(error?.localizedDescription ?? "Failed to authenticate")
                }
            }
        }

}
