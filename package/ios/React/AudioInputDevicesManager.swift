//
//  AudioInputManager.swift
//  VisionCamera
//
//  Created by SnowFox (Y.O) on 19.08.25.
//

import AVFoundation
import Foundation

@objc(AudioInputDevicesManager)
final class AudioInputDevicesManager: RCTEventEmitter {
    private let audioSession = AVAudioSession.sharedInstance()
    private let notificationCetner = NotificationCenter.default
    private var observer: NSKeyValueObservation?
    private let devicesChangedEventName = "AudioInputDevicesChanged"
    override init(){
        super.init()
        
    }
    
    override func supportedEvents() -> [String]! {
        return [devicesChangedEventName]
    }
    
    override static func requiresMainQueueSetup() -> Bool {
        return false
    }
    
    override func constantsToExport() -> [AnyHashable: Any]! {
        let devices = getDevicesJson()
        
        VisionLogger.log(level: .info, message: "Found \(devices.count) initial Audio Input Devices.")
        
        return [
            "availableAudioInputDevices": devices,
        ]
    }
    @objc private func handleAvailableInputsChanged(_ notification: Notification) {
        let devices = getDevicesJson()
        VisionLogger.log(level: .info, message: "Audio Input Devices changed - found \(devices.count) Audio Devices.")
        self.sendEvent(withName: self.devicesChangedEventName, body: devices)
    }
    
    private func getDevicesJson () ->  [[String: Any]] {
        return audioSession.availableInputs?.map { input in
            return [
                "portName": input.portName,
                "portType": input.portType.rawValue,
                "uid": input.uid,
            ]
        } ?? []
    }
    
    override func startObserving() {
        
        notificationCetner.addObserver(self, selector:#selector(handleAvailableInputsChanged(_:)) ,  name: AVAudioSession.routeChangeNotification, object: audioSession)
        
    }
    
    override func stopObserving() {
        notificationCetner.removeObserver(self)
        
    }
    
}


