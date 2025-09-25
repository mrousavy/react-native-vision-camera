package com.mrousavy.camera.core

import android.annotation.SuppressLint
import android.util.Log
import android.util.Size
import androidx.annotation.OptIn
import androidx.camera.video.ExperimentalPersistentRecording
import androidx.camera.video.FileOutputOptions
import androidx.camera.video.VideoRecordEvent
import com.mrousavy.camera.core.extensions.getCameraError
import com.mrousavy.camera.core.types.RecordVideoOptions
import com.mrousavy.camera.core.types.Video

@OptIn(ExperimentalPersistentRecording::class)
@SuppressLint("MissingPermission", "RestrictedApi")
fun CameraSession.startRecording(
  enableAudio: Boolean,
  options: RecordVideoOptions,
  callback: (video: Video) -> Unit,
  onError: (error: CameraError) -> Unit
) {
  if (camera == null) throw CameraNotReadyError()
  if (recording != null) throw RecordingInProgressError()
  val videoOutput = videoOutput ?: throw VideoNotEnabledError()

  // Create output video file
  val outputOptions = FileOutputOptions.Builder(options.file.file).also { outputOptions ->
    metadataProvider.location?.let { location ->
      Log.i(CameraSession.TAG, "Setting Video Location to ${location.latitude}, ${location.longitude}...")
      outputOptions.setLocation(location)
    }
  }.build()

  // TODO: Move this to JS so users can prepare recordings earlier
  // Prepare recording
  videoOutput.output.streamInfo
  var pendingRecording = videoOutput.output.prepareRecording(context, outputOptions)
  recordingWithExternalAudio = enableAudio
  if (enableAudio) {
    try {
      startAudioRecording(true, options, callback, onError)
    } catch (e: Throwable) {
      onError(EncoderError(e))
      return
    }
  }
  pendingRecording.withAudioEnabled(false)
  pendingRecording = pendingRecording.asPersistentRecording()

  isRecordingCanceled = false
  recording = pendingRecording.start(CameraQueues.cameraExecutor) { event ->
    when (event) {
      is VideoRecordEvent.Start -> Log.i(CameraSession.TAG, "Recording started!")

      is VideoRecordEvent.Resume -> Log.i(CameraSession.TAG, "Recording resumed!")

      is VideoRecordEvent.Pause -> Log.i(CameraSession.TAG, "Recording paused!")

      is VideoRecordEvent.Status -> Log.i(CameraSession.TAG, "Status update! Recorded ${event.recordingStats.numBytesRecorded} bytes.")

      is VideoRecordEvent.Finalize -> {
        if (isRecordingCanceled) {
          Log.i(CameraSession.TAG, "Recording was canceled, deleting file..")
          onError(RecordingCanceledError())
          try {
            options.file.file.delete()
          } catch (e: Throwable) {
            this.callback.onError(FileIOError(e))
          }
          return@start
        }

        Log.i(CameraSession.TAG, "Recording stopped!")
        val error = event.getCameraError()
        if (error != null) {
          if (error.wasVideoRecorded) {
            Log.e(CameraSession.TAG, "Video Recorder encountered an error, but the video was recorded anyways.", error)
          } else {
            Log.e(CameraSession.TAG, "Video Recorder encountered a fatal error!", error)
            onError(error)
            return@start
          }
        }
        val rawVideoPath = event.outputResults.outputUri.path ?: throw UnknownRecorderError(false, null)
        val size = videoOutput.attachedSurfaceResolution ?: Size(0, 0)
        val durationMs = event.recordingStats.recordedDurationNanos / 1_000_000

        val finalFile = options.file.file
        val audioFile = audioOutputFile
        val canMux = recordingWithExternalAudio && audioFile != null && audioFile.exists() && audioFile.length() > 0L

        if (canMux) {
          try {
            val tmpMux = java.io.File(finalFile.parentFile, finalFile.nameWithoutExtension + "-muxed.mp4")
            com.mrousavy.camera.core.utils.MediaMuxerUtils.muxMp4(
              videoPath = rawVideoPath,
              audioPath = audioFile!!.absolutePath,
              outputPath = tmpMux.absolutePath
            )
            finalFile.delete()
            tmpMux.renameTo(finalFile)
          } catch (e: Throwable) {
            Log.e(CameraSession.TAG, "Muxing failed!", e)
            onError(EncoderError(e))
            return@start
          } finally {
            recordingWithExternalAudio = false
            try { audioFile?.delete() } catch (_: Throwable) {}
            audioOutputFile = null
          }
        } else {
          // No audio or empty audio — just return the raw video
          recordingWithExternalAudio = false
          try { audioFile?.delete() } catch (_: Throwable) {}
          audioOutputFile = null
        }

        val finalPath = finalFile.absolutePath
        val video = Video(finalPath, durationMs, size)
        callback(video)

      }
    }
  }
}

fun CameraSession.stopRecording() {
  val recording = recording ?: throw NoRecordingInProgressError()
  stopAudioRecording()
  recording.stop()
  this.recording = null
}

fun CameraSession.cancelRecording() {
  isRecordingCanceled = true
  stopRecording()
  cancelAudioRecording()
}

fun CameraSession.pauseRecording() {
  val recording = recording ?: throw NoRecordingInProgressError()
  recording.pause()
  pauseAudioRecording()
}

fun CameraSession.resumeRecording() {
  val recording = recording ?: throw NoRecordingInProgressError()
  recording.resume()
  resumeAudioRecording()
}
