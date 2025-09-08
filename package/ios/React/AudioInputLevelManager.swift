//
//  AudioInputLevelManager.swift
//  VisionCamera
//
//  Created by SnowFox (Y.O) on 24.08.25.
//

import Foundation
import AVFAudio


@objc(AudioInputLevelManager)
final class AudioInputLevelManager: RCTEventEmitter {
    private let audioSession = AVAudioSession.sharedInstance()
    private let notificationCetner = NotificationCenter.default
    private var audioEngine = AVAudioEngine()
    private let audioLevelChangedEventName = "AudioInputLevelChanged"
    
    override init(){
        super.init()
    }
    
    override func invalidate() {
        notificationCetner.removeObserver(self)
        self.removeInputNode()
    }
    
    override static func requiresMainQueueSetup() -> Bool {
        return false
    }
    
    override func supportedEvents() -> [String]! {
        return [audioLevelChangedEventName]
    }
    
    private func startInputNode () {
        // update audio engine
        audioEngine = AVAudioEngine()
        let inputNode = audioEngine.inputNode
        let format = inputNode.inputFormat(forBus: 0)
        
        if (format.sampleRate == 0) {
            return
        }
        
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: format) { buffer, _ in
            let level = self.getSoundLevel(buffer: buffer)
            self.sendEvent(withName: self.audioLevelChangedEventName, body: level)
        }
        // Start audio engine and send events to the listener
        try? audioEngine.start()
    }
    
    @objc private func restartInputNode(_ notification: Notification) {
        guard let userInfo = notification.userInfo,
              let reasonValue = userInfo[AVAudioSessionRouteChangeReasonKey] as? UInt,
              let reason = AVAudioSession.RouteChangeReason(rawValue: reasonValue) else {
            return
        }
        
        switch reason {
        case .unknown:
            return
        default:
            self.startInputNode()
        }
        
    }
    
    private func removeInputNode() {
        audioEngine.stop()
        audioEngine.inputNode.removeTap(onBus: 0)
    }
    
    private func getSoundLevel(buffer: AVAudioPCMBuffer) -> Float {
        guard let channelData = buffer.floatChannelData else { return 0 }
        let channelDataArray = Array(UnsafeBufferPointer(start: channelData[0], count: Int(buffer.frameLength)))
        let rms = sqrt(channelDataArray.map { $0 * $0 }.reduce(0, +) / Float(buffer.frameLength) + Float.ulpOfOne)
        let level = 20 * log10(rms)
        return max(level + 100, 0)
    }
    
    @objc func handleInterruption(notification: Notification) {
        guard let info = notification.userInfo,
              let type = info[AVAudioSessionInterruptionTypeKey] as? UInt else { return }
        
        if type == AVAudioSession.InterruptionType.began.rawValue {
            // pause or stop engine
            if audioEngine.isRunning {
                audioEngine.pause()
                VisionLogger.log(level:.info, message:"audio engine interrupted status: paused")
            }
        } else if type == AVAudioSession.InterruptionType.ended.rawValue {
            // restart engine if needed
            try? audioEngine.start()
            VisionLogger.log(level:.info, message: "audio engine interrupted status: started")
            
        }
    }
    
    @objc func appMovedToBackground() {
        if audioEngine.isRunning {
            audioEngine.pause()
        }
    }
    
    @objc func appMovedToForeground() {
        try? audioEngine.start()
    }
    
    override func startObserving() {
        notificationCetner.addObserver(self, selector:#selector(restartInputNode(_:)) ,  name: AVAudioSession.routeChangeNotification, object: audioSession)
        notificationCetner.addObserver(self, selector: #selector(appMovedToBackground), name: UIApplication.willResignActiveNotification, object: nil)
        notificationCetner.addObserver(self, selector: #selector(appMovedToForeground), name: UIApplication.didBecomeActiveNotification, object: nil)
    }
    
    override func stopObserving() {
        notificationCetner.removeObserver(self)
        self.removeInputNode()
    }
}







