package com.margelo.nitro.camera.hybrids.recording

import androidx.camera.video.PendingRecording
import androidx.camera.video.Recording
import androidx.camera.video.VideoRecordEvent
import com.margelo.nitro.camera.HybridRecorderSpec
import com.margelo.nitro.camera.extensions.getThrowable
import com.margelo.nitro.camera.extensions.isRecoverableLimitReached
import com.margelo.nitro.camera.extensions.parallel
import com.margelo.nitro.camera.utils.IdentifiableExecutor
import com.margelo.nitro.core.Promise
import com.margelo.nitro.core.resolve
import java.io.File
import java.util.concurrent.Executors

class HybridVideoRecorder(
  private val pendingRecording: PendingRecording,
  private val file: File,
) : HybridRecorderSpec() {
  private val executor = IdentifiableExecutor("com.margelo.nitro.recorder")
  private var recording: Recording? = null
  private var isCancelled = false

  override val isRecording: Boolean
    get() = recording != null
  override var isPaused: Boolean = false
  override var recordedDuration: Double = 0.0
  override var recordedFileSize: Double = 0.0

  override val filePath: String
    get() = file.absolutePath

  override fun startRecording(
    onRecordingFinished: (String) -> Unit,
    onRecordingError: (Throwable) -> Unit,
    onRecordingPaused: (() -> Unit)?,
    onRecordingResumed: (() -> Unit)?,
  ): Promise<Unit> {
    var didResolve = false
    val promise = Promise<Unit>()

    executor.execute {
      // On our serial executor, make sure we are not currently recording
      if (this.recording != null) {
        val error = Error("Active recording already in progress!")
        promise.reject(error)
        return@execute
      }

      // Reset State
      this.isPaused = false
      this.recordedDuration = 0.0
      this.recordedFileSize = 0.0

      // Start recording
      this.recording =
        pendingRecording.start(executor) { event ->
          when (event) {
            is VideoRecordEvent.Start -> {
              promise.resolve()
              didResolve = true
            }
            is VideoRecordEvent.Pause -> onRecordingPaused?.invoke()
            is VideoRecordEvent.Resume -> onRecordingResumed?.invoke()
            is VideoRecordEvent.Finalize -> {
              if (isCancelled) {
                // Recording was cancelled - delete the file and don't notify
                isCancelled = false
                file.delete()
                return@start
              }
              val error = event.getThrowable()
              when {
                error == null || event.isRecoverableLimitReached -> {
                  // Recording finished successfully, or reached a configured
                  // `maxDuration` / `maxFileSize` limit. In both cases the file
                  // is finalized and usable.
                  val outputUri = event.outputResults.outputUri
                  onRecordingFinished(outputUri.toString())
                }
                !didResolve -> {
                  // Recording didn't even start yet - something went wrong!
                  promise.reject(error)
                  didResolve = true
                }
                else -> {
                  // We are in an active recording, but an error occurred!
                  onRecordingError(error)
                }
              }
            }
            is VideoRecordEvent.Status -> {
              this.recordedDuration = event.recordingStats.recordedDurationNanos / 1_000_000_000.0
              this.recordedFileSize = event.recordingStats.numBytesRecorded.toDouble()
            }
          }
        }
    }

    return promise
  }

  override fun stopRecording(): Promise<Unit> {
    return Promise.parallel(executor) {
      val recording = recording ?: throw Error("Not currently recording!")
      recording.stop()
      this.isPaused = false
      this.recording = null
      this.recordedDuration = 0.0
      this.recordedFileSize = 0.0
    }
  }

  override fun pauseRecording(): Promise<Unit> {
    return Promise.parallel(executor) {
      val recording = recording ?: throw Error("Not currently recording!")
      recording.pause()
      this.isPaused = true
    }
  }

  override fun resumeRecording(): Promise<Unit> {
    return Promise.parallel(executor) {
      val recording = recording ?: throw Error("Not currently recording!")
      recording.resume()
      this.isPaused = false
    }
  }

  override fun cancelRecording(): Promise<Unit> {
    return Promise.parallel(executor) {
      val recording = recording ?: throw Error("Not currently recording!")
      // Mark as cancelled so the Finalize event deletes
      // the file instead of notifying the caller
      this.isCancelled = true
      recording.close()
      this.isPaused = false
      this.recording = null
      this.recordedDuration = 0.0
      this.recordedFileSize = 0.0
    }
  }
}
