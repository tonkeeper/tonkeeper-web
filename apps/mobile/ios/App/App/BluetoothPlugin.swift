import Capacitor
import CoreBluetooth

@objc(BluetoothPlugin)
public class BluetoothPlugin: CAPPlugin, CAPBridgedPlugin, CBCentralManagerDelegate, CBPeripheralDelegate {
    public let identifier = "BluetoothPlugin"
    public let jsName = "Bluetooth"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getAvailability", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestDevice", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "connect", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "disconnect", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getPrimaryServices", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getCharacteristic", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getCharacteristics", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "writeValue", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startNotifications", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopNotifications", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "reset", returnType: CAPPluginReturnPromise)
    ]

    private var centralManager: CBCentralManager?
    private var discoveredPeripherals: [String: CBPeripheral] = [:]
    private var callReferences: [String: CAPPluginCall] = [:]
    private var serviceCache: [String: [CBService]] = [:]
    private var characteristicCache: [String: [CBCharacteristic]] = [:]
    private var connectionTimeouts: [String: Timer] = [:]
    private var isScanning: Bool = false

    private func initializeCentralManagerIfNeeded() {
        if centralManager == nil {
            centralManager = CBCentralManager(delegate: self, queue: nil, options: [CBCentralManagerOptionShowPowerAlertKey: true])
        }
    }

    @objc func getAvailability(_ call: CAPPluginCall) {
        initializeCentralManagerIfNeeded()
        guard let central = centralManager else {
            call.reject("Bluetooth manager not initialized")
            return
        }
        let isAvailable = central.state != .unsupported && central.state != .unauthorized
        call.resolve(["available": isAvailable])
    }

    @objc func reset(_ call: CAPPluginCall) {
        print("BluetoothPlugin: Resetting plugin state")
        if isScanning {
            centralManager?.stopScan()
            isScanning = false
        }
        for peripheral in discoveredPeripherals.values {
            if peripheral.state != .disconnected {
                centralManager?.cancelPeripheralConnection(peripheral)
            }
        }
        discoveredPeripherals.removeAll()
        serviceCache.removeAll()
        characteristicCache.removeAll()
        callReferences.removeAll()
        connectionTimeouts.values.forEach { $0.invalidate() }
        connectionTimeouts.removeAll()
        call.resolve()
    }

    @objc func requestDevice(_ call: CAPPluginCall) {
        initializeCentralManagerIfNeeded()
        guard let central = centralManager else {
            call.reject("Bluetooth manager not initialized")
            return
        }
        guard central.state == .poweredOn else {
            call.reject("Bluetooth is not powered on")
            return
        }

        if isScanning {
            central.stopScan()
            isScanning = false
        }
        for peripheral in discoveredPeripherals.values {
            if peripheral.state != .disconnected {
                print("BluetoothPlugin: Disconnecting lingering peripheral: \(peripheral.identifier.uuidString)")
                central.cancelPeripheralConnection(peripheral)
            }
        }

        let services = call.getArray("services", String.self)?.compactMap { CBUUID(string: $0) } ?? []
        print("BluetoothPlugin: Scanning for peripherals with services: \(services.map { $0.uuidString })")
        callReferences[call.callbackId] = call
        central.scanForPeripherals(withServices: services, options: nil)
        isScanning = true
    }

    @objc func connect(_ call: CAPPluginCall) {
        guard let central = centralManager else {
            call.reject("Bluetooth manager not initialized")
            return
        }
        guard let deviceId = call.getString("deviceId"),
              let peripheral = discoveredPeripherals[deviceId] else {
            print("BluetoothPlugin: Device not found for deviceId: \(call.getString("deviceId") ?? "nil")")
            call.reject("Device not found")
            return
        }

        print("BluetoothPlugin: Connecting to peripheral: \(deviceId)")
        callReferences[call.callbackId] = call
        peripheral.delegate = self
        central.connect(peripheral, options: nil)

        let timeout = Timer.scheduledTimer(withTimeInterval: 10.0, repeats: false) { [weak self] _ in
            guard let self = self, let call = self.callReferences[call.callbackId] else { return }
            print("BluetoothPlugin: Connection timeout for peripheral: \(deviceId)")
            self.centralManager?.cancelPeripheralConnection(peripheral)
            call.reject("Connection timed out")
            self.callReferences.removeValue(forKey: call.callbackId)
            self.connectionTimeouts.removeValue(forKey: call.callbackId)
        }
        connectionTimeouts[call.callbackId] = timeout
    }

    @objc func disconnect(_ call: CAPPluginCall) {
        guard let central = centralManager else {
            call.reject("Bluetooth manager not initialized")
            return
        }
        guard let deviceId = call.getString("deviceId"),
              let peripheral = discoveredPeripherals[deviceId] else {
            print("BluetoothPlugin: Device not found for deviceId: \(call.getString("deviceId") ?? "nil")")
            call.reject("Device not found")
            return
        }

        print("BluetoothPlugin: Disconnecting peripheral: \(deviceId)")
        central.cancelPeripheralConnection(peripheral)
        serviceCache.removeValue(forKey: deviceId)
        characteristicCache = characteristicCache.filter { !$0.key.contains(deviceId) }
        call.resolve()
    }

    @objc func getPrimaryServices(_ call: CAPPluginCall) {
        guard let deviceId = call.getString("deviceId"),
              let peripheral = discoveredPeripherals[deviceId] else {
            print("BluetoothPlugin: Device not found for deviceId: \(call.getString("deviceId") ?? "nil")")
            call.reject("Device not found")
            return
        }

        if let services = serviceCache[deviceId], !services.isEmpty {
            print("BluetoothPlugin: Returning cached services for \(deviceId)")
            call.resolve(["services": services.map { ["uuid": $0.uuid.uuidString] }])
        } else {
            print("BluetoothPlugin: Discovering services for \(deviceId)")
            callReferences[call.callbackId] = call
            peripheral.discoverServices(nil)
        }
    }

    @objc func getCharacteristic(_ call: CAPPluginCall) {
        guard let deviceId = call.getString("deviceId"),
              let peripheral = discoveredPeripherals[deviceId],
              let serviceUUID = call.getString("serviceUuid"),
              let characteristicUUID = call.getString("characteristicUuid"),
              let services = serviceCache[deviceId] else {
            print("BluetoothPlugin: Invalid parameters - deviceId: \(call.getString("deviceId") ?? "nil"), serviceUuid: \(call.getString("serviceUuid") ?? "nil")")
            call.reject("Service not found")
            return
        }

        let normalizedCharacteristicUUID = characteristicUUID.uppercased()
        let service = services.first(where: { $0.uuid.uuidString == serviceUUID })
        if let service = service,
           let characteristics = characteristicCache[service.uuid.uuidString],
           let characteristic = characteristics.first(where: { $0.uuid.uuidString == normalizedCharacteristicUUID }) {
            print("BluetoothPlugin: Found characteristic \(normalizedCharacteristicUUID) in cache")
            call.resolve(["uuid": characteristic.uuid.uuidString])
        } else if let service = service {
            print("BluetoothPlugin: Characteristic \(normalizedCharacteristicUUID) not in cache, discovering for service \(serviceUUID)")
            callReferences[call.callbackId] = call
            peripheral.discoverCharacteristics([CBUUID(string: characteristicUUID)], for: service)
            DispatchQueue.main.asyncAfter(deadline: .now() + 5.0) { [weak self] in
                guard let self = self, let pendingCall = self.callReferences[call.callbackId] else { return }
                if self.characteristicCache[serviceUUID]?.first(where: { $0.uuid.uuidString == normalizedCharacteristicUUID }) == nil {
                    print("BluetoothPlugin: Timeout waiting for characteristic \(normalizedCharacteristicUUID)")
                    pendingCall.reject("Characteristic \(characteristicUUID) not found after timeout")
                    self.callReferences.removeValue(forKey: call.callbackId)
                }
            }
        } else {
            print("BluetoothPlugin: Service \(serviceUUID) not found for device \(deviceId)")
            call.reject("Service not found")
        }
    }

    @objc func getCharacteristics(_ call: CAPPluginCall) {
        guard let deviceId = call.getString("deviceId"),
              let peripheral = discoveredPeripherals[deviceId],
              let serviceUUID = call.getString("serviceUuid"),
              let services = serviceCache[deviceId],
              let service = services.first(where: { $0.uuid.uuidString == serviceUUID }) else {
            print("BluetoothPlugin: Service not found - deviceId: \(call.getString("deviceId") ?? "nil"), serviceUuid: \(call.getString("serviceUuid") ?? "nil")")
            call.reject("Service not found")
            return
        }

        if let characteristics = characteristicCache[service.uuid.uuidString], !characteristics.isEmpty {
            print("BluetoothPlugin: Returning cached characteristics for service \(serviceUUID)")
            call.resolve(["characteristics": characteristics.map { ["uuid": $0.uuid.uuidString] }])
        } else {
            print("BluetoothPlugin: Discovering all characteristics for service \(serviceUUID)")
            callReferences[call.callbackId] = call
            peripheral.discoverCharacteristics(nil, for: service)
        }
    }

    @objc func writeValue(_ call: CAPPluginCall) {
        guard let deviceId = call.getString("deviceId"),
              let peripheral = discoveredPeripherals[deviceId],
              let serviceUUID = call.getString("serviceUuid"),
              let characteristicUUID = call.getString("characteristicUuid"),
              let valueBase64 = call.getString("value"),
              let value = Data(base64Encoded: valueBase64),
              let services = serviceCache[deviceId],
              let service = services.first(where: { $0.uuid.uuidString == serviceUUID }),
              let characteristics = characteristicCache[service.uuid.uuidString],
              let characteristic = characteristics.first(where: { $0.uuid.uuidString == characteristicUUID }) else {
            print("BluetoothPlugin: Invalid parameters for write")
            call.reject("Invalid parameters")
            return
        }

        print("BluetoothPlugin: Writing value to \(characteristicUUID): \(valueBase64)")
        peripheral.writeValue(value, for: characteristic, type: .withResponse)
        call.resolve()
    }

    @objc func startNotifications(_ call: CAPPluginCall) {
        guard let deviceId = call.getString("deviceId"),
              let peripheral = discoveredPeripherals[deviceId],
              let serviceUUID = call.getString("serviceUuid"),
              let characteristicUUID = call.getString("characteristicUuid"),
              let services = serviceCache[deviceId],
              let service = services.first(where: { $0.uuid.uuidString == serviceUUID }),
              let characteristics = characteristicCache[service.uuid.uuidString],
              let characteristic = characteristics.first(where: { $0.uuid.uuidString == characteristicUUID }) else {
            print("BluetoothPlugin: Invalid parameters for notifications")
            call.reject("Invalid parameters")
            return
        }

        print("BluetoothPlugin: Starting notifications for \(characteristicUUID)")
        peripheral.setNotifyValue(true, for: characteristic)
        call.resolve()
    }

    @objc func stopNotifications(_ call: CAPPluginCall) {
        guard let deviceId = call.getString("deviceId"),
              let peripheral = discoveredPeripherals[deviceId],
              let serviceUUID = call.getString("serviceUuid"),
              let characteristicUUID = call.getString("characteristicUuid"),
              let services = serviceCache[deviceId],
              let service = services.first(where: { $0.uuid.uuidString == serviceUUID }),
              let characteristics = characteristicCache[service.uuid.uuidString],
              let characteristic = characteristics.first(where: { $0.uuid.uuidString == characteristicUUID }) else {
            print("BluetoothPlugin: Invalid parameters for stop notifications")
            call.reject("Invalid parameters")
            return
        }

        print("BluetoothPlugin: Stopping notifications for \(characteristicUUID)")
        peripheral.setNotifyValue(false, for: characteristic)
        call.resolve()
    }

    public func centralManagerDidUpdateState(_ central: CBCentralManager) {
        notifyListeners("availabilitychanged", data: ["value": central.state == .poweredOn])
    }

    public func centralManager(_ central: CBCentralManager, didDiscover peripheral: CBPeripheral, advertisementData: [String: Any], rssi RSSI: NSNumber) {
        let deviceId = peripheral.identifier.uuidString
        print("BluetoothPlugin: Discovered peripheral: \(deviceId), name: \(peripheral.name ?? "unnamed"), RSSI: \(RSSI), state: \(peripheral.state.rawValue)")
        discoveredPeripherals[deviceId] = peripheral

        if let call = callReferences.values.first(where: { $0.callbackId == callReferences.keys.first { callReferences[$0]?.callbackId == $0 } }) {
            call.resolve([
                "device": [
                    "id": deviceId,
                    "name": peripheral.name ?? ""
                ]
            ])
            callReferences.removeValue(forKey: call.callbackId)
            central.stopScan()
            isScanning = false
        }
    }

    public func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
        let deviceId = peripheral.identifier.uuidString
        print("BluetoothPlugin: Did connect to peripheral: \(deviceId)")
        if let call = callReferences.values.first(where: { $0.getString("deviceId") == deviceId }) {
            connectionTimeouts[call.callbackId]?.invalidate()
            connectionTimeouts.removeValue(forKey: call.callbackId)
            call.resolve(["deviceId": deviceId])
            callReferences.removeValue(forKey: call.callbackId)
        }
        peripheral.delegate = self
        peripheral.discoverServices(nil)
    }

    public func centralManager(_ central: CBCentralManager, didFailToConnect peripheral: CBPeripheral, error: Error?) {
        let deviceId = peripheral.identifier.uuidString
        print("BluetoothPlugin: Failed to connect to peripheral: \(deviceId), error: \(error?.localizedDescription ?? "unknown")")
        if let call = callReferences.values.first(where: { $0.getString("deviceId") == deviceId }) {
            connectionTimeouts[call.callbackId]?.invalidate()
            connectionTimeouts.removeValue(forKey: call.callbackId)
            call.reject("Failed to connect: \(error?.localizedDescription ?? "unknown")")
            callReferences.removeValue(forKey: call.callbackId)
        }
    }

    public func centralManager(_ central: CBCentralManager, didDisconnectPeripheral peripheral: CBPeripheral, error: Error?) {
        let deviceId = peripheral.identifier.uuidString
        print("BluetoothPlugin: Did disconnect peripheral: \(deviceId), error: \(error?.localizedDescription ?? "none")")
        notifyListeners("gattserverdisconnected", data: ["deviceId": deviceId])
        serviceCache.removeValue(forKey: deviceId)
        characteristicCache = characteristicCache.filter { !$0.key.contains(deviceId) }
    }

    public func peripheral(_ peripheral: CBPeripheral, didDiscoverServices error: Error?) {
        let deviceId = peripheral.identifier.uuidString
        print("BluetoothPlugin: Did discover services for peripheral: \(deviceId), error: \(error?.localizedDescription ?? "none")")
        if let services = peripheral.services {
            serviceCache[deviceId] = services
            services.forEach { peripheral.discoverCharacteristics(nil, for: $0) }
        } else {
            print("BluetoothPlugin: No services found for peripheral \(deviceId)")
        }
        if let call = callReferences.values.first(where: { $0.getString("deviceId") == deviceId }) {
            print("BluetoothPlugin: Resolving getPrimaryServices for deviceId: \(deviceId)")
            call.resolve(["services": serviceCache[deviceId]?.map { ["uuid": $0.uuid.uuidString] } ?? []])
            callReferences.removeValue(forKey: call.callbackId)
        }
    }

    public func peripheral(_ peripheral: CBPeripheral, didDiscoverCharacteristicsFor service: CBService, error: Error?) {
        let deviceId = peripheral.identifier.uuidString
        print("BluetoothPlugin: Did discover characteristics for service: \(service.uuid.uuidString), error: \(error?.localizedDescription ?? "none")")
        if let characteristics = service.characteristics {
            characteristicCache[service.uuid.uuidString] = characteristics
            print("BluetoothPlugin: Cached characteristics: \(characteristics.map { $0.uuid.uuidString })")
            if let call = callReferences.values.first(where: { $0.getString("serviceUuid") == service.uuid.uuidString }) {
                if let characteristicUUID = call.getString("characteristicUuid") {
                    let normalizedCharacteristicUUID = characteristicUUID.uppercased()
                    if let characteristic = characteristics.first(where: { $0.uuid.uuidString == normalizedCharacteristicUUID }) {
                        print("BluetoothPlugin: Resolving getCharacteristic for \(normalizedCharacteristicUUID)")
                        call.resolve(["uuid": characteristic.uuid.uuidString])
                        callReferences.removeValue(forKey: call.callbackId)
                    } else {
                        print("BluetoothPlugin: Characteristic \(normalizedCharacteristicUUID) not found in service \(service.uuid.uuidString)")
                        call.reject("Characteristic \(characteristicUUID) not found")
                        callReferences.removeValue(forKey: call.callbackId)
                    }
                } else {
                    print("BluetoothPlugin: Resolving getCharacteristics for service: \(service.uuid.uuidString)")
                    call.resolve(["characteristics": characteristics.map { ["uuid": $0.uuid.uuidString] }])
                    callReferences.removeValue(forKey: call.callbackId)
                }
            }
        } else if let call = callReferences.values.first(where: { $0.getString("serviceUuid") == service.uuid.uuidString }) {
            print("BluetoothPlugin: No characteristics found for service \(service.uuid.uuidString)")
            call.reject("No characteristics found")
            callReferences.removeValue(forKey: call.callbackId)
        }
    }

    public func peripheral(_ peripheral: CBPeripheral, didUpdateValueFor characteristic: CBCharacteristic, error: Error?) {
        let deviceId = peripheral.identifier.uuidString
        print("BluetoothPlugin: Did update value for characteristic: \(characteristic.uuid.uuidString), error: \(error?.localizedDescription ?? "none")")
        if let value = characteristic.value {
            notifyListeners("characteristicValueChanged", data: [
                "deviceId": deviceId,
                "serviceUuid": characteristic.service?.uuid.uuidString ?? "",
                "characteristicUuid": characteristic.uuid.uuidString,
                "value": value.base64EncodedString()
            ])
        }
    }

    public func peripheral(_ peripheral: CBPeripheral, didWriteValueFor characteristic: CBCharacteristic, error: Error?) {
        print("BluetoothPlugin: Did write value for characteristic: \(characteristic.uuid.uuidString), error: \(error?.localizedDescription ?? "none")")
    }

    private func stateToString(_ state: CBManagerState) -> String {
        switch state {
        case .poweredOff: return "poweredOff"
        case .poweredOn: return "poweredOn"
        case .resetting: return "resetting"
        case .unauthorized: return "unauthorized"
        case .unknown: return "unknown"
        case .unsupported: return "unsupported"
        @unknown default: return "unknown"
        }
    }
}
