package com.mrousavy.camera.core

import android.annotation.SuppressLint
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

  val audioOut = OutputFile(context, context.cacheDir, ".m4a")
  audioOutputFile = audioOut.file

    audioRecorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      MediaRecorder(context)
    } else {
      MediaRecorder()
    }
    audioRecorder?.setAudioSource(MediaRecorder.AudioSource.MIC)
    audioRecorder?.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
    audioRecorder?.setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
    audioRecorder?.setAudioSamplingRate(44100)
    audioRecorder?.setAudioChannels(1)
    audioRecorder?.setAudioEncodingBitRate(128_000)

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
  if (audioRecorder != null) {
    audioRecorder?.stop()
    audioRecorder?.release()
    this.audioRecorder = null
  }

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

