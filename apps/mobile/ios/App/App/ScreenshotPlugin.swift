import Foundation
import Capacitor
import UIKit

@objc public class ScreenshotPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "ScreenshotPlugin"
    public let jsName = "Screenshot"
    public let pluginMethods: [CAPPluginMethod] = []

    override public func load() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(userDidTakeScreenshot),
            name: UIApplication.userDidTakeScreenshotNotification,
            object: nil
        )
    }

    @objc private func userDidTakeScreenshot() {
        notifyListeners("screenshotTaken", data: [:])
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }
}
