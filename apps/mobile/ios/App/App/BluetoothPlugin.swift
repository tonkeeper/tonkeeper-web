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

    private struct Timeouts {
        static let connection: TimeInterval = 10.0
        static let serviceDiscovery: TimeInterval = 5.0
        static let characteristicDiscovery: TimeInterval = 5.0
        static let maxRetryAttempts = 3
        static let keepAliveInterval: TimeInterval = 2.0
        static let connectionTimeout: TimeInterval = 30.0
        static let writeTimeout: TimeInterval = 5.0
        static let notificationTimeout: TimeInterval = 5.0
    }

    private var centralManager: CBCentralManager?
    private var discoveredPeripherals: [String: CBPeripheral] = [:]
    private var callReferences: [String: CAPPluginCall] = [:]
    private var serviceCache: [String: [CBService]] = [:]
    private var characteristicCache: [String: [CBCharacteristic]] = [:]
    private var connectionTimeouts: [String: Timer] = [:]
    private var isScanning: Bool = false
    private var retryAttempts: [String: Int] = [:]
    private var isInitialized: Bool = false
    private var initializationCallbacks: [() -> Void] = []
    private var keepAliveTimers: [String: Timer] = [:]
    private var isReconnecting: [String: Bool] = [:]
    private var isDiscoveringServices: [String: Bool] = [:]
    private var isDiscoveringCharacteristics: [String: Bool] = [:]
    private var lastActivityTime: [String: Date] = [:]

    private let queue = DispatchQueue(label: "com.tonkeeper.bluetooth", qos: .userInitiated, attributes: .concurrent)
    private let stateQueue = DispatchQueue(label: "com.tonkeeper.bluetooth.state", qos: .userInitiated)

    private func safeAccess<T>(_ block: () -> T) -> T {
        return queue.sync { block() }
    }

    private func safeStateAccess<T>(_ block: () -> T) -> T {
        return stateQueue.sync { block() }
    }

    private func asyncStateAccess(_ block: @escaping () -> Void) {
        stateQueue.async { block() }
    }

    private func initializeCentralManagerIfNeeded() {
        safeStateAccess {
            if centralManager == nil {
                centralManager = CBCentralManager(delegate: self, queue: queue, options: [
                    CBCentralManagerOptionShowPowerAlertKey: true,
                    CBCentralManagerOptionRestoreIdentifierKey: "com.tonkeeper.bluetooth"
                ])
            }
        }
    }

    private func waitForInitialization(completion: @escaping () -> Void) {
        safeStateAccess {
            if isInitialized {
                completion()
            } else {
                initializationCallbacks.append(completion)
            }
        }
    }

    private func checkBluetoothState() -> Bool {
        guard let central = centralManager else {
            return false
        }
        
        switch central.state {
        case .poweredOn:
            return true
        case .poweredOff:
            notifyListeners("bluetoothStateChanged", data: [
                "state": "poweredOff",
                "message": "Please enable Bluetooth in your device settings to continue."
            ])
            return false
        case .unauthorized:
            notifyListeners("bluetoothStateChanged", data: [
                "state": "unauthorized",
                "message": "Bluetooth access is not authorized. Please enable it in your device settings."
            ])
            return false
        case .unsupported:
            notifyListeners("bluetoothStateChanged", data: [
                "state": "unsupported",
                "message": "Bluetooth is not supported on this device."
            ])
            return false
        case .resetting:
            notifyListeners("bluetoothStateChanged", data: [
                "state": "resetting",
                "message": "Bluetooth is resetting. Please try again in a moment."
            ])
            return false
        case .unknown:
            notifyListeners("bluetoothStateChanged", data: [
                "state": "unknown",
                "message": "Bluetooth state is unknown. Please try again."
            ])
            return false
        @unknown default:
            notifyListeners("bluetoothStateChanged", data: [
                "state": "unknown",
                "message": "Bluetooth state is unknown. Please try again."
            ])
            return false
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

    private func cleanup() {
        safeAccess {
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
            retryAttempts.removeAll()
            isReconnecting.removeAll()
            
            keepAliveTimers.values.forEach { $0.invalidate() }
            keepAliveTimers.removeAll()
            
            connectionTimeouts.values.forEach { $0.invalidate() }
            connectionTimeouts.removeAll()
        }
    }

    @objc func reset(_ call: CAPPluginCall) {
        print("BluetoothPlugin: Resetting plugin state")
        cleanup()
        call.resolve()
    }

    @objc func requestDevice(_ call: CAPPluginCall) {
        initializeCentralManagerIfNeeded()
        guard let central = centralManager else {
            call.reject("Bluetooth manager not initialized")
            return
        }
        
        waitForInitialization { [weak self] in
            guard let self = self else { return }
            
            self.asyncStateAccess {
                if !self.checkBluetoothState() {
                    let state = central.state
                    var message = "Bluetooth is not available. Please enable Bluetooth in your device settings."
                    
                    switch state {
                    case .poweredOff:
                        message = "Bluetooth is turned off. Please enable Bluetooth in your device settings to continue."
                    case .unauthorized:
                        message = "Bluetooth access is not authorized. Please enable it in your device settings."
                    case .unsupported:
                        message = "Bluetooth is not supported on this device."
                    case .resetting:
                        message = "Bluetooth is resetting. Please try again in a moment."
                    case .unknown:
                        message = "Bluetooth is initializing. Please try again in a moment."
                    @unknown default:
                        message = "Bluetooth state is unknown. Please try again."
                    }
                    
                    call.reject(message)
                    return
                }

                if self.isScanning {
                    central.stopScan()
                    self.isScanning = false
                }
                
                for peripheral in self.discoveredPeripherals.values {
                    if peripheral.state != .disconnected {
                        print("BluetoothPlugin: Disconnecting lingering peripheral: \(peripheral.identifier.uuidString)")
                        central.cancelPeripheralConnection(peripheral)
                    }
                }

                // Get services from options
                var services: [CBUUID] = []
                
                // Handle both direct services array and filters array
                if let servicesArray = call.getArray("services", String.self) {
                    services = servicesArray.compactMap { CBUUID(string: $0) }
                } else if let filters = call.getArray("filters", [String: Any].self) {
                    // Extract services from filters
                    services = filters.compactMap { filter -> [CBUUID]? in
                        if let filterServices = filter["services"] as? [String] {
                            return filterServices.compactMap { CBUUID(string: $0) }
                        }
                        return nil
                    }.flatMap { $0 }
                }
                
                print("BluetoothPlugin: Scanning for peripherals with services: \(services.map { $0.uuidString })")
                
                // Store the call for later use
                self.callReferences[call.callbackId] = call
                
                // Start scanning
                central.scanForPeripherals(withServices: services.isEmpty ? nil : services, options: nil)
                self.isScanning = true
                
                // Set a timeout for scanning
                let timeout = Timer.scheduledTimer(withTimeInterval: 10.0, repeats: false) { [weak self] _ in
                    guard let self = self else { return }
                    self.asyncStateAccess {
                        if self.isScanning {
                            central.stopScan()
                            self.isScanning = false
                            if let call = self.callReferences[call.callbackId] {
                                call.reject("No devices found")
                                self.callReferences.removeValue(forKey: call.callbackId)
                            }
                        }
                    }
                }
                self.connectionTimeouts[call.callbackId] = timeout
            }
        }
    }

    @objc func connect(_ call: CAPPluginCall) {
        guard let central = centralManager else {
            call.reject("Bluetooth manager not initialized")
            return
        }
        
        waitForInitialization { [weak self] in
            guard let self = self else { return }
            
            self.safeAccess {
                if !self.checkBluetoothState() {
                    let state = central.state
                    var message = "Bluetooth is not available. Please enable Bluetooth in your device settings."
                    
                    switch state {
                    case .poweredOff:
                        message = "Bluetooth is turned off. Please enable Bluetooth in your device settings to continue."
                    case .unauthorized:
                        message = "Bluetooth access is not authorized. Please enable it in your device settings."
                    case .unsupported:
                        message = "Bluetooth is not supported on this device."
                    case .resetting:
                        message = "Bluetooth is resetting. Please try again in a moment."
                    case .unknown:
                        message = "Bluetooth is initializing. Please try again in a moment."
                    @unknown default:
                        message = "Bluetooth state is unknown. Please try again."
                    }
                    
                    call.reject(message)
                    return
                }
                
                guard let deviceId = call.getString("deviceId"),
                      let peripheral = self.discoveredPeripherals[deviceId] else {
                    print("BluetoothPlugin: Device not found for deviceId: \(call.getString("deviceId") ?? "nil")")
                    call.reject("Device not found")
                    return
                }

                // Check if we're already connected or connecting
                if peripheral.state == .connected {
                    print("BluetoothPlugin: Device already connected: \(deviceId)")
                    call.resolve(["deviceId": deviceId])
                    return
                }
                
                if peripheral.state == .connecting {
                    print("BluetoothPlugin: Device already connecting: \(deviceId)")
                    call.reject("Device is already connecting")
                    return
                }

                // Clean up any existing state for this device
                self.serviceCache.removeValue(forKey: deviceId)
                self.characteristicCache = self.characteristicCache.filter { !$0.key.contains(deviceId) }
                self.retryAttempts.removeValue(forKey: deviceId)
                self.isReconnecting.removeValue(forKey: deviceId)
                self.isDiscoveringServices.removeValue(forKey: deviceId)
                self.isDiscoveringCharacteristics.removeValue(forKey: deviceId)
                self.lastActivityTime.removeValue(forKey: deviceId)
                self.stopKeepAlive(for: deviceId)

                print("BluetoothPlugin: Connecting to peripheral: \(deviceId)")
                self.callReferences[call.callbackId] = call
                peripheral.delegate = self
                central.connect(peripheral, options: nil)

                let timeout = Timer.scheduledTimer(withTimeInterval: Timeouts.connection, repeats: false) { [weak self] _ in
                    guard let self = self else { return }
                    self.safeAccess {
                        guard let call = self.callReferences[call.callbackId] else { return }
                        print("BluetoothPlugin: Connection timeout for peripheral: \(deviceId)")
                        self.centralManager?.cancelPeripheralConnection(peripheral)
                        call.reject("Connection timed out")
                        self.callReferences.removeValue(forKey: call.callbackId)
                        self.connectionTimeouts.removeValue(forKey: call.callbackId)
                    }
                }
                self.connectionTimeouts[call.callbackId] = timeout
            }
        }
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
        callReferences[call.callbackId] = call
        central.cancelPeripheralConnection(peripheral)
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
              let serviceUuid = call.getString("serviceUuid"),
              let characteristicUuid = call.getString("characteristicUuid"),
              let valueBase64 = call.getString("value"),
              let value = Data(base64Encoded: valueBase64),
              let peripheral = discoveredPeripherals[deviceId],
              let services = serviceCache[deviceId],
              let service = services.first(where: { $0.uuid.uuidString == serviceUuid }),
              let characteristics = characteristicCache[service.uuid.uuidString],
              let characteristic = characteristics.first(where: { $0.uuid.uuidString == characteristicUuid }) else {
            print("BluetoothPlugin: Invalid parameters for write - deviceId: \(call.getString("deviceId") ?? "nil"), serviceUuid: \(call.getString("serviceUuid") ?? "nil"), characteristicUuid: \(call.getString("characteristicUuid") ?? "nil")")
            call.reject("Invalid parameters for write")
            return
        }

        if peripheral.state != .connected {
            print("BluetoothPlugin: Device not connected, cannot write value")
            call.reject("Device not connected")
            return
        }

        if isDiscoveringServices[deviceId] == true || isDiscoveringCharacteristics[deviceId] == true {
            print("BluetoothPlugin: Waiting for service/characteristic discovery to complete")
            call.reject("Service or characteristic discovery in progress")
            return
        }

        print("BluetoothPlugin: Writing value to characteristic: \(characteristicUuid)")
        callReferences[call.callbackId] = call
        peripheral.writeValue(value, for: characteristic, type: .withResponse)

        // Add a timeout for the write operation
        let timeout = Timer.scheduledTimer(withTimeInterval: Timeouts.writeTimeout, repeats: false) { [weak self] _ in
            guard let self = self else { return }
            self.safeAccess {
                if let call = self.callReferences[call.callbackId] {
                    print("BluetoothPlugin: Write timeout for characteristic: \(characteristicUuid)")
                    call.reject("Write operation timed out")
                    self.callReferences.removeValue(forKey: call.callbackId)
                }
            }
        }
        self.connectionTimeouts[call.callbackId] = timeout
    }

    @objc func startNotifications(_ call: CAPPluginCall) {
        guard let deviceId = call.getString("deviceId"),
              let serviceUuid = call.getString("serviceUuid"),
              let characteristicUuid = call.getString("characteristicUuid"),
              let peripheral = discoveredPeripherals[deviceId],
              let services = serviceCache[deviceId],
              let service = services.first(where: { $0.uuid.uuidString == serviceUuid }),
              let characteristics = characteristicCache[service.uuid.uuidString],
              let characteristic = characteristics.first(where: { $0.uuid.uuidString == characteristicUuid }) else {
            print("BluetoothPlugin: Invalid parameters for startNotifications - deviceId: \(call.getString("deviceId") ?? "nil"), serviceUuid: \(call.getString("serviceUuid") ?? "nil"), characteristicUuid: \(call.getString("characteristicUuid") ?? "nil")")
            call.reject("Invalid parameters for notifications")
            return
        }

        if peripheral.state != .connected {
            print("BluetoothPlugin: Device not connected, cannot start notifications")
            call.reject("Device not connected")
            return
        }

        if isDiscoveringServices[deviceId] == true || isDiscoveringCharacteristics[deviceId] == true {
            print("BluetoothPlugin: Waiting for service/characteristic discovery to complete")
            call.reject("Service or characteristic discovery in progress")
            return
        }

        print("BluetoothPlugin: Starting notifications for characteristic: \(characteristicUuid)")
        callReferences[call.callbackId] = call
        peripheral.setNotifyValue(true, for: characteristic)

        // Add a timeout for the notification operation
        let timeout = Timer.scheduledTimer(withTimeInterval: Timeouts.notificationTimeout, repeats: false) { [weak self] _ in
            guard let self = self else { return }
            self.safeAccess {
                if let call = self.callReferences[call.callbackId] {
                    print("BluetoothPlugin: Notification timeout for characteristic: \(characteristicUuid)")
                    call.reject("Notification operation timed out")
                    self.callReferences.removeValue(forKey: call.callbackId)
                }
            }
        }
        self.connectionTimeouts[call.callbackId] = timeout
    }

    @objc func stopNotifications(_ call: CAPPluginCall) {
        guard let deviceId = call.getString("deviceId"),
              let serviceUuid = call.getString("serviceUuid"),
              let characteristicUuid = call.getString("characteristicUuid"),
              let peripheral = discoveredPeripherals[deviceId],
              let services = serviceCache[deviceId],
              let service = services.first(where: { $0.uuid.uuidString == serviceUuid }),
              let characteristics = characteristicCache[service.uuid.uuidString],
              let characteristic = characteristics.first(where: { $0.uuid.uuidString == characteristicUuid }) else {
            print("BluetoothPlugin: Invalid parameters for stopNotifications - deviceId: \(call.getString("deviceId") ?? "nil"), serviceUuid: \(call.getString("serviceUuid") ?? "nil"), characteristicUuid: \(call.getString("characteristicUuid") ?? "nil")")
            call.reject("Invalid parameters for notifications")
            return
        }

        print("BluetoothPlugin: Stopping notifications for characteristic: \(characteristicUuid)")
        callReferences[call.callbackId] = call
        peripheral.setNotifyValue(false, for: characteristic)
    }

    public func centralManagerDidUpdateState(_ central: CBCentralManager) {
        let state = stateToString(central.state)
        let isAvailable = central.state == .poweredOn
        notifyListeners("availabilitychanged", data: ["value": isAvailable])
        notifyListeners("bluetoothStateChanged", data: ["state": state])
        
        asyncStateAccess {
            if !self.isInitialized {
                self.isInitialized = true
                self.initializationCallbacks.forEach { $0() }
                self.initializationCallbacks.removeAll()
            }
            
            if central.state == .poweredOn {
                // Attempt to reconnect to previously connected devices
                for peripheral in self.discoveredPeripherals.values {
                    if peripheral.state == .disconnected {
                        central.connect(peripheral, options: nil)
                    }
                }
            } else if central.state == .poweredOff {
                // Clean up resources when Bluetooth is turned off
                self.isScanning = false
                central.stopScan()
                for peripheral in self.discoveredPeripherals.values {
                    if peripheral.state != .disconnected {
                        central.cancelPeripheralConnection(peripheral)
                    }
                }
            }
        }
    }

    public func centralManager(_ central: CBCentralManager, didDiscover peripheral: CBPeripheral, advertisementData: [String: Any], rssi RSSI: NSNumber) {
        let deviceId = peripheral.identifier.uuidString
        print("BluetoothPlugin: Discovered peripheral: \(deviceId), name: \(peripheral.name ?? "unnamed"), RSSI: \(RSSI), state: \(peripheral.state.rawValue)")
        
        asyncStateAccess {
            self.discoveredPeripherals[deviceId] = peripheral
            
            // Find the appropriate call for this discovery
            if let call = self.callReferences.values.first(where: { $0.callbackId == self.callReferences.keys.first { self.callReferences[$0]?.callbackId == $0 } }) {
                // Stop scanning
                central.stopScan()
                self.isScanning = false
                
                // Invalidate timeout
                if let timeout = self.connectionTimeouts[call.callbackId] {
                    timeout.invalidate()
                    self.connectionTimeouts.removeValue(forKey: call.callbackId)
                }
                
                // Resolve with device info
                call.resolve([
                    "device": [
                        "id": deviceId,
                        "name": peripheral.name ?? ""
                    ]
                ])
                self.callReferences.removeValue(forKey: call.callbackId)
            }
        }
    }

    public func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
        let deviceId = peripheral.identifier.uuidString
        print("BluetoothPlugin: Did connect to peripheral: \(deviceId), state: \(peripheral.state.rawValue)")
        
        safeAccess {
            retryAttempts[deviceId] = 0
            isReconnecting[deviceId] = false
            isDiscoveringServices[deviceId] = false
            isDiscoveringCharacteristics[deviceId] = false
            updateLastActivity(for: deviceId)
            
            if let call = callReferences.values.first(where: { $0.getString("deviceId") == deviceId }) {
                connectionTimeouts[call.callbackId]?.invalidate()
                connectionTimeouts.removeValue(forKey: call.callbackId)
                call.resolve(["deviceId": deviceId])
                callReferences.removeValue(forKey: call.callbackId)
            }
            
            // Only start service discovery if the device is still connected
            if peripheral.state == .connected {
                peripheral.delegate = self
                print("BluetoothPlugin: Starting service discovery for device: \(deviceId)")
                isDiscoveringServices[deviceId] = true
                peripheral.discoverServices(nil)
                startKeepAlive(for: deviceId)
            } else {
                print("BluetoothPlugin: Device not connected, skipping service discovery")
            }
        }
    }

    public func centralManager(_ central: CBCentralManager, didFailToConnect peripheral: CBPeripheral, error: Error?) {
        let deviceId = peripheral.identifier.uuidString
        print("BluetoothPlugin: Failed to connect to peripheral: \(deviceId), error: \(error?.localizedDescription ?? "unknown")")

        safeAccess {
            isReconnecting[deviceId] = false
            if let call = callReferences.values.first(where: { $0.getString("deviceId") == deviceId }) {
                connectionTimeouts[call.callbackId]?.invalidate()
                connectionTimeouts.removeValue(forKey: call.callbackId)

                if let attempts = retryAttempts[deviceId], attempts < Timeouts.maxRetryAttempts {
                    retryAttempts[deviceId] = attempts + 1
                    print("BluetoothPlugin: Retrying connection to \(deviceId), attempt \(attempts + 1)")
                    central.connect(peripheral, options: nil)
                } else {
                    call.reject("Failed to connect: \(error?.localizedDescription ?? "unknown")")
                    callReferences.removeValue(forKey: call.callbackId)
                    retryAttempts.removeValue(forKey: deviceId)
                }
            }
        }
    }

    public func centralManager(_ central: CBCentralManager, didDisconnectPeripheral peripheral: CBPeripheral, error: Error?) {
        let deviceId = peripheral.identifier.uuidString
        print("BluetoothPlugin: Did disconnect peripheral: \(deviceId), error: \(error?.localizedDescription ?? "none"), state: \(peripheral.state.rawValue)")
        
        safeAccess {
            stopKeepAlive(for: deviceId)
            notifyListeners("gattserverdisconnected", data: ["deviceId": deviceId])
            
            // Clean up resources for this device
            serviceCache.removeValue(forKey: deviceId)
            characteristicCache = characteristicCache.filter { !$0.key.contains(deviceId) }
            retryAttempts.removeValue(forKey: deviceId)
            isReconnecting.removeValue(forKey: deviceId)
            isDiscoveringServices.removeValue(forKey: deviceId)
            isDiscoveringCharacteristics.removeValue(forKey: deviceId)
            lastActivityTime.removeValue(forKey: deviceId)
            
            // Resolve any pending disconnect call
            if let call = callReferences.values.first(where: { $0.getString("deviceId") == deviceId }) {
                call.resolve()
                callReferences.removeValue(forKey: call.callbackId)
            }

            // Only attempt to reconnect if it was an unexpected disconnect and we're not already reconnecting
            if let error = error, isReconnecting[deviceId] == false {
                isReconnecting[deviceId] = true
                print("BluetoothPlugin: Attempting to reconnect to \(deviceId) after unexpected disconnect, error: \(error.localizedDescription)")
                
                // Add a delay before reconnecting to allow the system to stabilize
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { [weak self] in
                    guard let self = self else { return }
                    self.safeAccess {
                        if self.isReconnecting[deviceId] == true {
                            central.connect(peripheral, options: nil)
                        }
                    }
                }
            }
        }
    }

    public func peripheral(_ peripheral: CBPeripheral, didDiscoverServices error: Error?) {
        let deviceId = peripheral.identifier.uuidString
        print("BluetoothPlugin: Did discover services for peripheral: \(deviceId), error: \(error?.localizedDescription ?? "none"), state: \(peripheral.state.rawValue)")

        safeAccess {
            isDiscoveringServices[deviceId] = false
            
            if let error = error {
                print("BluetoothPlugin: Service discovery failed for device: \(deviceId), error: \(error.localizedDescription)")
                if let call = callReferences.values.first(where: { $0.getString("deviceId") == deviceId }) {
                    call.reject("Failed to discover services: \(error.localizedDescription)")
                    callReferences.removeValue(forKey: call.callbackId)
                }
                return
            }

            if let services = peripheral.services {
                print("BluetoothPlugin: Discovered \(services.count) services for device: \(deviceId)")
                serviceCache[deviceId] = services
                
                // Only discover characteristics if the device is still connected
                if peripheral.state == .connected {
                    for service in services {
                        print("BluetoothPlugin: Discovering characteristics for service: \(service.uuid.uuidString)")
                        isDiscoveringCharacteristics[deviceId] = true
                        peripheral.discoverCharacteristics(nil, for: service)
                    }
                } else {
                    print("BluetoothPlugin: Device not connected, skipping characteristic discovery")
                }
            } else {
                print("BluetoothPlugin: No services found for peripheral \(deviceId)")
            }

            if let call = callReferences.values.first(where: { $0.getString("deviceId") == deviceId }) {
                print("BluetoothPlugin: Resolving getPrimaryServices for deviceId: \(deviceId)")
                call.resolve(["services": serviceCache[deviceId]?.map { ["uuid": $0.uuid.uuidString] } ?? []])
                callReferences.removeValue(forKey: call.callbackId)
            }
        }
    }

    public func peripheral(_ peripheral: CBPeripheral, didDiscoverCharacteristicsFor service: CBService, error: Error?) {
        let deviceId = peripheral.identifier.uuidString
        print("BluetoothPlugin: Did discover characteristics for service: \(service.uuid.uuidString), error: \(error?.localizedDescription ?? "none"), state: \(peripheral.state.rawValue)")

        safeAccess {
            if let error = error {
                print("BluetoothPlugin: Characteristic discovery failed for service: \(service.uuid.uuidString), error: \(error.localizedDescription)")
                if let call = callReferences.values.first(where: { $0.getString("serviceUuid") == service.uuid.uuidString }) {
                    call.reject("Failed to discover characteristics: \(error.localizedDescription)")
                    callReferences.removeValue(forKey: call.callbackId)
                }
                return
            }

            if let characteristics = service.characteristics {
                print("BluetoothPlugin: Discovered \(characteristics.count) characteristics for service: \(service.uuid.uuidString)")
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

            // Check if this was the last service to discover characteristics
            if let services = serviceCache[deviceId],
               services.allSatisfy({ $0.characteristics != nil }) {
                isDiscoveringCharacteristics[deviceId] = false
            }
        }
    }

    public func peripheral(_ peripheral: CBPeripheral, didUpdateValueFor characteristic: CBCharacteristic, error: Error?) {
        let deviceId = peripheral.identifier.uuidString
        print("BluetoothPlugin: Did update value for characteristic: \(characteristic.uuid.uuidString), error: \(error?.localizedDescription ?? "none")")
        
        updateLastActivity(for: deviceId)
        
        if let error = error {
            notifyListeners("characteristicValueError", data: [
                "deviceId": deviceId,
                "serviceUuid": characteristic.service?.uuid.uuidString ?? "",
                "characteristicUuid": characteristic.uuid.uuidString,
                "error": error.localizedDescription
            ])
            return
        }
        
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
        let deviceId = peripheral.identifier.uuidString
        print("BluetoothPlugin: Did write value for characteristic: \(characteristic.uuid.uuidString), error: \(error?.localizedDescription ?? "none")")
        
        updateLastActivity(for: deviceId)
        
        // Find and resolve the pending call
        if let call = callReferences.values.first(where: { $0.getString("characteristicUuid") == characteristic.uuid.uuidString }) {
            if let error = error {
                call.reject("Failed to write value: \(error.localizedDescription)")
            } else {
                call.resolve()
            }
            callReferences.removeValue(forKey: call.callbackId)
        }
        
        if let error = error {
            notifyListeners("writeError", data: [
                "deviceId": deviceId,
                "serviceUuid": characteristic.service?.uuid.uuidString ?? "",
                "characteristicUuid": characteristic.uuid.uuidString,
                "error": error.localizedDescription
            ])
        }
    }

    public func peripheral(_ peripheral: CBPeripheral, didUpdateNotificationStateFor characteristic: CBCharacteristic, error: Error?) {
        let deviceId = peripheral.identifier.uuidString
        print("BluetoothPlugin: Did update notification state for characteristic: \(characteristic.uuid.uuidString), error: \(error?.localizedDescription ?? "none")")
        
        updateLastActivity(for: deviceId)
        
        // Find and resolve the pending call
        if let call = callReferences.values.first(where: { $0.getString("characteristicUuid") == characteristic.uuid.uuidString }) {
            if let error = error {
                call.reject("Failed to update notification state: \(error.localizedDescription)")
            } else {
                call.resolve()
            }
            callReferences.removeValue(forKey: call.callbackId)
        }
        
        if let error = error {
            notifyListeners("notificationError", data: [
                "deviceId": deviceId,
                "serviceUuid": characteristic.service?.uuid.uuidString ?? "",
                "characteristicUuid": characteristic.uuid.uuidString,
                "error": error.localizedDescription
            ])
        }
    }

    public func centralManager(_ central: CBCentralManager, willRestoreState dict: [String : Any]) {
        print("BluetoothPlugin: Restoring state")

        if let peripherals = dict[CBCentralManagerRestoredStatePeripheralsKey] as? [CBPeripheral] {
            safeAccess {
                for peripheral in peripherals {
                    let deviceId = peripheral.identifier.uuidString
                    print("BluetoothPlugin: Restoring peripheral: \(deviceId)")
                    discoveredPeripherals[deviceId] = peripheral
                    peripheral.delegate = self
                }
            }
        }
        

        if let scanOptions = dict[CBCentralManagerRestoredStateScanOptionsKey] as? [String: Any] {
            print("BluetoothPlugin: Restoring scan options: \(scanOptions)")
            if let services = scanOptions[CBCentralManagerScanOptionSolicitedServiceUUIDsKey] as? [CBUUID] {
                print("BluetoothPlugin: Restoring scan for services: \(services.map { $0.uuidString })")
                safeAccess {
                    isScanning = true
                    central.scanForPeripherals(withServices: services, options: nil)
                }
            }
        }
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

    private func startKeepAlive(for deviceId: String) {
        print("BluetoothPlugin: Starting keep-alive for device: \(deviceId)")
        stopKeepAlive(for: deviceId)
        
        let timer = Timer.scheduledTimer(withTimeInterval: Timeouts.keepAliveInterval, repeats: true) { [weak self] _ in
            guard let self = self,
                  let peripheral = self.discoveredPeripherals[deviceId] else {
                print("BluetoothPlugin: Keep-alive failed - device not found: \(deviceId)")
                return
            }
            
            print("BluetoothPlugin: Keep-alive ping for device: \(deviceId), state: \(peripheral.state.rawValue)")
            
            if peripheral.state != .connected {
                print("BluetoothPlugin: Keep-alive skipped - device not connected: \(deviceId)")
                return
            }

            // Check if we need to reconnect due to inactivity
            if let lastActivity = self.lastActivityTime[deviceId],
               Date().timeIntervalSince(lastActivity) > Timeouts.connectionTimeout {
                print("BluetoothPlugin: Connection timeout detected, reconnecting: \(deviceId)")
                self.centralManager?.cancelPeripheralConnection(peripheral)
                self.centralManager?.connect(peripheral, options: nil)
                return
            }
            
            // Send a ping to keep the connection alive
            if let services = self.serviceCache[deviceId],
               let service = services.first,
               let characteristics = self.characteristicCache[service.uuid.uuidString],
               let characteristic = characteristics.first {
                print("BluetoothPlugin: Sending keep-alive ping to characteristic: \(characteristic.uuid.uuidString)")
                peripheral.readValue(for: characteristic)
            } else {
                print("BluetoothPlugin: Keep-alive failed - no characteristics found for device: \(deviceId)")
            }
        }
        keepAliveTimers[deviceId] = timer
    }

    private func stopKeepAlive(for deviceId: String) {
        keepAliveTimers[deviceId]?.invalidate()
        keepAliveTimers.removeValue(forKey: deviceId)
    }

    private func updateLastActivity(for deviceId: String) {
        lastActivityTime[deviceId] = Date()
    }

    deinit {
        cleanup()
        safeAccess {
            centralManager?.delegate = nil
            centralManager = nil
        }
    }
}
