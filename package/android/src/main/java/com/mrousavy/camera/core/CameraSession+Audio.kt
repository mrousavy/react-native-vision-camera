package com.mrousavy.camera.core

import android.annotation.SuppressLint
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.media.AudioDeviceInfo
import android.media.AudioManager
import android.media.MediaRecorder
import android.os.Build
import androidx.annotation.OptIn
import androidx.camera.video.ExperimentalPersistentRecording
import com.mrousavy.camera.core.types.RecordVideoOptions
import com.mrousavy.camera.core.types.Video
import com.mrousavy.camera.core.utils.OutputFile


// handle Audio Recording errors here
@OptIn(ExperimentalPersistentRecording::class)
@SuppressLint("MissingPermission", "RestrictedApi")
fun CameraSession.startAudioRecording(
  enableAudio: Boolean,
  options: RecordVideoOptions,
  callback: (video: Video) -> Unit,
  onError: (error: CameraError) -> Unit
) {
  if (enableAudio) {
    checkMicrophonePermission()
  }
  audioRecorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
    MediaRecorder(context)
  } else {
    MediaRecorder()
  }

  val audioOut = OutputFile(context, context.cacheDir, ".m4a")
  this.audioOutputFile = audioOut.file

  val isBluetoothSco = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
    audioDevice?.type == AudioDeviceInfo.TYPE_BLUETOOTH_SCO
  } else false

  if (isBluetoothSco) {
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        if (hasBluetoothPermissionForRouting()) {
          try { audioManager.setCommunicationDevice(audioDevice as AudioDeviceInfo) } catch (_: Throwable) { }
        }
      } else {
        audioManager.mode = AudioManager.MODE_IN_COMMUNICATION
        if (audioManager.isBluetoothScoAvailableOffCall) {
          audioManager.startBluetoothSco()
          awaitScoConnected(context)
        }
      }
    } catch (_: Throwable) { }
  }

  val source = if (isBluetoothSco && hasBluetoothPermissionForRouting()) MediaRecorder.AudioSource.VOICE_COMMUNICATION else MediaRecorder.AudioSource.MIC

  audioRecorder?.setAudioSource(source)
  audioRecorder?.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
  audioRecorder?.setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
  
  if (isBluetoothSco) {
    // BT SCO typically uses 8kHz, but some devices support 16kHz
    // Try 8kHz first as it's the most common SCO rate
    audioRecorder?.setAudioSamplingRate(8000)
    audioRecorder?.setAudioChannels(1)
    audioRecorder?.setAudioEncodingBitRate(16000) // Lower bitrate for 8kHz
  } else {
    audioRecorder?.setAudioSamplingRate(44100)
    audioRecorder?.setAudioChannels(1)
    audioRecorder?.setAudioEncodingBitRate(128_000)
  }
  val outFile = audioOut.file
  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
    audioRecorder?.setOutputFile(outFile)
  } else {
    audioRecorder?.setOutputFile(outFile.absolutePath)
  }

  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      audioRecorder?.preferredDevice = audioDevice
  }
  audioRecorder?.prepare()
  audioRecorder?.start()
}

fun CameraSession.stopAudioRecording() {
  val audioRecorder = audioRecorder ?: throw NoRecordingInProgressError()
  audioRecorder.stop()
  audioRecorder.release()
  this.audioRecorder = null

  try {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      try { audioManager.clearCommunicationDevice() } catch (_: Throwable) { }
    } else {
      if (audioManager.mode == AudioManager.MODE_IN_COMMUNICATION) {
        try { audioManager.stopBluetoothSco() } catch (_: Throwable) { }
        audioManager.mode = AudioManager.MODE_NORMAL
      }
    }
  } catch (_: Throwable) { }
}

fun CameraSession.cancelAudioRecording() {
  isRecordingCanceled = true
  stopAudioRecording()
}

fun CameraSession.pauseAudioRecording() {
  val audioRecorder = audioRecorder ?: throw NoRecordingInProgressError()
  audioRecorder.pause()
}

fun CameraSession.resumeAudioRecording() {
  val audioRecorder = audioRecorder ?: throw NoRecordingInProgressError()
  audioRecorder.resume()
}

private fun CameraSession.awaitScoConnected(context: Context, timeoutMs: Long = 600): Boolean {
  val filter = IntentFilter(AudioManager.ACTION_SCO_AUDIO_STATE_UPDATED)
  var connected = false
  val receiver = object : BroadcastReceiver() {
    override fun onReceive(c: Context?, intent: Intent?) {
      val state = intent?.getIntExtra(AudioManager.EXTRA_SCO_AUDIO_STATE, AudioManager.SCO_AUDIO_STATE_ERROR)
      if (state == AudioManager.SCO_AUDIO_STATE_CONNECTED) {
        connected = true
      }
    }
  }
  try {
    context.registerReceiver(receiver, filter)
    try { Thread.sleep(timeoutMs) } catch (_: Throwable) { }
  } catch (_: Throwable) { }
  try { context.unregisterReceiver(receiver) } catch (_: Throwable) { }
  return connected
}
