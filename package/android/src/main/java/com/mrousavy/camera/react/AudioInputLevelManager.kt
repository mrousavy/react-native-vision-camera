package com.mrousavy.camera.react

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.media.*
import android.os.Build
import android.util.Log
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter
import com.mrousavy.camera.core.MicrophonePermissionError
import kotlin.concurrent.thread
import kotlin.math.log10
import kotlin.math.sqrt

class AudioInputLevelManager(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private val eventName = "AudioInputLevelChanged"
  private val audioManager: AudioManager =
    reactContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager

  private var deviceCallback: AudioDeviceCallback? = null
  private var audioRecord: AudioRecord? = null
  private var isMonitoring = false
  private var monitorThread: Thread? = null
  private var preferredAudioDevice: AudioDeviceInfo? = null

  companion object {
    private const val TAG = "AudioInputLevelManager"
  }

  internal fun checkMicrophonePermission() {
    val status = ContextCompat.checkSelfPermission(reactContext, Manifest.permission.RECORD_AUDIO)
    if (status != PackageManager.PERMISSION_GRANTED) throw MicrophonePermissionError()
  }

  override fun getName(): String = TAG

  /**
   * Start monitoring mic levels in a background thread.
   */
  @SuppressLint("MissingPermission")
  private fun startLevelMonitoring() {
    checkMicrophonePermission()
    if (isMonitoring) return

    val sampleRate = 44100
    val bufferSize = AudioRecord.getMinBufferSize(
      sampleRate,
      AudioFormat.CHANNEL_IN_MONO,
      AudioFormat.ENCODING_PCM_16BIT
    )

    audioRecord = AudioRecord(
      MediaRecorder.AudioSource.MIC,
      sampleRate,
      AudioFormat.CHANNEL_IN_MONO,
      AudioFormat.ENCODING_PCM_16BIT,
      bufferSize
    )

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      // Apply preferred input device if set
      preferredAudioDevice?.let { device ->
        try {
          audioRecord?.preferredDevice = device
        } catch (_: Throwable) {
          // ignore, will fall back to system routing
        }
      }
    }

    audioRecord?.startRecording()
    isMonitoring = true

    monitorThread = thread(start = true) {
      val buffer = ShortArray(bufferSize)
      while (isMonitoring && audioRecord != null) {
        val read = audioRecord!!.read(buffer, 0, buffer.size)
        if (read > 0) {
          // Compute RMS and dB
          var sum: Long = 0
          for (i in 0 until read) {
            sum += buffer[i] * buffer[i]
          }
          val rms = sqrt(sum.toDouble() / read)
          val db = if (rms > 0) 20 * log10(rms / Short.MAX_VALUE) else -160.0
          val normalized = ((db + 160) / 160 * 100).coerceIn(0.0, 100.0)
          sendLevelToJS(normalized)
        }

        try {
          Thread.sleep(100) // emit every 100 ms
        } catch (e: InterruptedException) {
          break
        }
      }
    }
  }

  private fun stopLevelMonitoring() {
    isMonitoring = false
    monitorThread?.interrupt()
    monitorThread = null

    audioRecord?.stop()
    audioRecord?.release()
    audioRecord = null
  }

  private fun sendLevelToJS(dbLevel: Double) {
    val emitter = reactContext.getJSModule(RCTDeviceEventEmitter::class.java)
    emitter.emit(eventName, dbLevel)
  }

  @Suppress("unused", "UNUSED_PARAMETER")
  @ReactMethod
  fun addListener(eventName: String) {
    Log.d(TAG, "Listener added for $eventName")

    if (deviceCallback == null) {
      deviceCallback = object : AudioDeviceCallback() {
        override fun onAudioDevicesAdded(addedDevices: Array<out AudioDeviceInfo>) {
          Log.d(TAG, "Audio devices added")
        }

        override fun onAudioDevicesRemoved(removedDevices: Array<out AudioDeviceInfo>) {
          Log.d(TAG, "Audio devices removed")
        }
      }
      audioManager.registerAudioDeviceCallback(deviceCallback!!, null)
    }

    startLevelMonitoring()
  }

  @Suppress("unused", "UNUSED_PARAMETER")
  @ReactMethod
  fun removeListeners(count: Int) {
    Log.d(TAG, "removeListeners called")

    stopLevelMonitoring()

    deviceCallback?.let {
      audioManager.unregisterAudioDeviceCallback(it)
      deviceCallback = null
    }
  }

  /**
   * Sets the preferred audio input device by its UID (AudioDeviceInfo.id as String).
   * If monitoring is already active, it will be restarted to apply the change.
   */
  @ReactMethod
  fun setPreferredAudioInputDevice(uid: String?) {
    val inputs = audioManager.getDevices(AudioManager.GET_DEVICES_INPUTS)
    val newDevice = uid?.let { idStr ->
      inputs.firstOrNull { it.id.toString() == idStr }
    }

    preferredAudioDevice = newDevice

    if (isMonitoring) {
      // Recreate AudioRecord to ensure routing applies
      stopLevelMonitoring()
      startLevelMonitoring()
    }
  }
}

