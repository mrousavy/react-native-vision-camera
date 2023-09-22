package com.mrousavy.camera.core

import android.content.Context
import android.hardware.camera2.params.DynamicRangeProfiles
import android.media.MediaCodec
import android.media.MediaCodecInfo
import android.media.MediaFormat
import android.media.MediaMuxer
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.Message
import android.util.Log
import android.util.Size
import android.view.Surface
import com.mrousavy.camera.RecorderError
import com.mrousavy.camera.parsers.Orientation
import com.mrousavy.camera.parsers.VideoCodec
import com.mrousavy.camera.parsers.VideoFileType
import java.io.File
import java.lang.ref.WeakReference
import java.nio.ByteBuffer

class RecordingSession(
  context: Context,
  val size: Size,
  private val enableAudio: Boolean,
  private val fps: Int = 30,
  private val dynamicRangeProfile: Long? = null,
  private val codec: VideoCodec = VideoCodec.H264,
  private val orientation: Orientation,
  private val fileType: VideoFileType = VideoFileType.MP4,
  private val callback: (video: Video) -> Unit,
  private val onError: (error: RecorderError) -> Unit
) {
  companion object {
    private const val TAG = "RecordingSession"

    // bits per second
    private const val VIDEO_BIT_RATE = 10_000_000
    private const val VIDEO_IFRAME_INTERVAL = 1
    private const val AUDIO_SAMPLING_RATE = 44_100
    private const val AUDIO_BIT_RATE = 16 * AUDIO_SAMPLING_RATE
    private const val AUDIO_CHANNELS = 1

    private const val VERBOSE = true
  }

  data class Video(val path: String, val durationMs: Long)

  private val recorder: MediaCodec
  private val outputFile: File
  private val encoderThread: EncoderThread
  private var startTime: Long? = null
  private var isRecording = false
  val surface: Surface

  init {
    outputFile = File.createTempFile("mrousavy", fileType.toExtension(), context.cacheDir)
    Log.i(TAG, "Creating RecordingSession for ${outputFile.absolutePath}")

    // Set up either H264 (mp4) or H265 (hevc) profile
    val mimeType = when (codec) {
      VideoCodec.H264 -> MediaFormat.MIMETYPE_VIDEO_AVC
      VideoCodec.H265 -> MediaFormat.MIMETYPE_VIDEO_HEVC
    }
    recorder = MediaCodec.createEncoderByType(mimeType)

    Log.i(TAG, "Creating ${size.width}x${size.height}@$fps $codec MediaCodec")
    val format = MediaFormat.createVideoFormat(mimeType, size.width, size.height)

    // Configure standard video metadata
    format.setInteger(MediaFormat.KEY_COLOR_FORMAT, MediaCodecInfo.CodecCapabilities.COLOR_FormatSurface)
    format.setInteger(MediaFormat.KEY_BIT_RATE, VIDEO_BIT_RATE)
    format.setInteger(MediaFormat.KEY_FRAME_RATE, fps)
    format.setInteger(MediaFormat.KEY_I_FRAME_INTERVAL, VIDEO_IFRAME_INTERVAL)

    // Configure HDR
    val codecProfile = when (dynamicRangeProfile) {
      DynamicRangeProfiles.HLG10 -> MediaCodecInfo.CodecProfileLevel.HEVCProfileMain10
      DynamicRangeProfiles.HDR10 -> MediaCodecInfo.CodecProfileLevel.HEVCProfileMain10HDR10
      DynamicRangeProfiles.HDR10_PLUS -> MediaCodecInfo.CodecProfileLevel.HEVCProfileMain10HDR10Plus
      else -> -1
    }
    if (codecProfile != -1) {
      // HDR
      format.setInteger(MediaFormat.KEY_PROFILE, codecProfile)
      format.setInteger(MediaFormat.KEY_LEVEL, MediaCodecInfo.CodecProfileLevel.HEVCHighTierLevel31)
      format.setInteger(MediaFormat.KEY_COLOR_STANDARD, MediaFormat.COLOR_STANDARD_BT2020)
      format.setInteger(MediaFormat.KEY_COLOR_RANGE, MediaFormat.COLOR_RANGE_FULL)
      format.setInteger(MediaFormat.KEY_COLOR_TRANSFER, getTransferFunction(codecProfile))
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        format.setFeatureEnabled(MediaCodecInfo.CodecCapabilities.FEATURE_HdrEditing, true)
      }
    } else {
      // SDR
      when (codec) {
        VideoCodec.H264 -> {
          format.setInteger(MediaFormat.KEY_PROFILE, MediaCodecInfo.CodecProfileLevel.AVCProfileHigh)
          format.setInteger(MediaFormat.KEY_LEVEL, MediaCodecInfo.CodecProfileLevel.AVCLevel31)
        }
        VideoCodec.H265 -> {
          format.setInteger(MediaFormat.KEY_PROFILE, MediaCodecInfo.CodecProfileLevel.HEVCProfileMain)
          format.setInteger(MediaFormat.KEY_LEVEL, MediaCodecInfo.CodecProfileLevel.HEVCHighTierLevel31)
        }
      }
    }
    Log.i(TAG, "Configuring MediaCodec with format: $format")

    // Configure MediaCodec, after that the Surface is ready
    recorder.configure(format, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
    surface = recorder.createInputSurface()
    encoderThread = EncoderThread(recorder, outputFile, 0)

    Log.i(TAG, "Created $this!")
  }

  private fun getTransferFunction(codecProfile: Int) =
    when (codecProfile) {
      MediaCodecInfo.CodecProfileLevel.HEVCProfileMain10 -> MediaFormat.COLOR_TRANSFER_HLG
      MediaCodecInfo.CodecProfileLevel.HEVCProfileMain10HDR10 -> MediaFormat.COLOR_TRANSFER_ST2084
      MediaCodecInfo.CodecProfileLevel.HEVCProfileMain10HDR10Plus -> MediaFormat.COLOR_TRANSFER_ST2084
      else -> MediaFormat.COLOR_TRANSFER_SDR_VIDEO
    }

  fun start() {
    synchronized(this) {
      Log.i(TAG, "Starting RecordingSession..")
      recorder.start()
      encoderThread.start()
      encoderThread.waitUntilReady()
      isRecording = true
      startTime = System.currentTimeMillis()
    }
  }

  fun stop() {
    synchronized(this) {
      Log.i(TAG, "Stopping RecordingSession..")
      try {
        isRecording = false
        recorder.stop()
        recorder.release()
      } catch (e: Error) {
        Log.e(TAG, "Failed to stop MediaRecorder!", e)
      }

      val stopTime = System.currentTimeMillis()
      val durationMs = stopTime - (startTime ?: stopTime)
      callback(Video(outputFile.absolutePath, durationMs))
    }
  }

  fun pause() {
    synchronized(this) {
      Log.i(TAG, "Pausing Recording Session..")
      // TODO: Confirm pause() works
      isRecording = false
      recorder.stop()
    }
  }

  fun resume() {
    synchronized(this) {
      Log.i(TAG, "Resuming Recording Session..")
      // TODO: Confirm resume() works
      recorder.start()
      isRecording = true
    }
  }

  override fun toString(): String {
    val audio = if (enableAudio) "with audio" else "without audio"
    return "${size.width} x ${size.height} @ $fps FPS $codec $fileType $orientation RecordingSession ($audio)"
  }

  /**
   * Notifies the encoder thread that a new frame is available to the encoder.
   */
  public fun frameAvailable() {
    synchronized(this) {
      if (!isRecording) return
      val handler = encoderThread.getHandler()
      handler.sendMessage(
        handler.obtainMessage(
          EncoderThread.EncoderHandler.MSG_FRAME_AVAILABLE
        )
      )
    }
  }

  /**
   * Object that encapsulates the encoder thread.
   * <p>
   * We want to sleep until there's work to do.  We don't actually know when a new frame
   * arrives at the encoder, because the other thread is sending frames directly to the
   * input surface.  We will see data appear at the decoder output, so we can either use
   * an infinite timeout on dequeueOutputBuffer() or wait() on an object and require the
   * calling app wake us.  It's very useful to have all of the buffer management local to
   * this thread -- avoids synchronization -- so we want to do the file muxing in here.
   * So, it's best to sleep on an object and do something appropriate when awakened.
   * <p>
   * This class does not manage the MediaCodec encoder startup/shutdown.  The encoder
   * should be fully started before the thread is created, and not shut down until this
   * thread has been joined.
   */
  private class EncoderThread(mediaCodec: MediaCodec, outputFile: File, orientationHint: Int) : Thread() {
    val mEncoder = mediaCodec
    var mEncodedFormat: MediaFormat? = null
    val mBufferInfo = MediaCodec.BufferInfo()
    val mMuxer = MediaMuxer(outputFile.getPath(), MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)
    val mOrientationHint = orientationHint
    var mVideoTrack: Int = -1

    var mHandler: EncoderHandler? = null
    var mFrameNum: Int = 0

    val mLock: Object = Object()

    @Volatile
    var mReady: Boolean = false

    /**
     * Thread entry point.
     * <p>
     * Prepares the Looper, Handler, and signals anybody watching that we're ready to go.
     */
    public override fun run() {
      Looper.prepare()
      mHandler = EncoderHandler(this) // must create on encoder thread
      Log.d(TAG, "encoder thread ready")
      synchronized(mLock) {
        mReady = true
        mLock.notify() // signal waitUntilReady()
      }

      Looper.loop()

      synchronized(mLock) {
        mReady = false
        mHandler = null
      }
      Log.d(TAG, "looper quit")
    }

    /**
     * Waits until the encoder thread is ready to receive messages.
     * <p>
     * Call from non-encoder thread.
     */
    public fun waitUntilReady() {
      synchronized(mLock) {
        while (!mReady) {
          try {
            mLock.wait()
          } catch (ie: InterruptedException) { /* not expected */ }
        }
      }
    }

    /**
     * Waits until the encoder has processed a single frame.
     * <p>
     * Call from non-encoder thread.
     */
    public fun waitForFirstFrame() {
      synchronized(mLock) {
        while (mFrameNum < 1) {
          try {
            mLock.wait()
          } catch (ie: InterruptedException) {
            ie.printStackTrace()
          }
        }
      }
      Log.d(TAG, "Waited for first frame")
    }

    /**
     * Returns the Handler used to send messages to the encoder thread.
     */
    public fun getHandler(): EncoderHandler {
      synchronized(mLock) {
        // Confirm ready state.
        if (!mReady) {
          throw RuntimeException("not ready")
        }
      }
      return mHandler!!
    }

    /**
     * Drains all pending output from the encoder, and adds it to the circular buffer.
     */
    public fun drainEncoder(): Boolean {
      val timeoutUs: Long = 0 // no timeout -- check for buffers, bail if none
      var encodedFrame = false

      while (true) {
        val encoderStatus: Int = mEncoder.dequeueOutputBuffer(mBufferInfo, timeoutUs)
        if (encoderStatus == MediaCodec.INFO_TRY_AGAIN_LATER) {
          // no output available yet
          break
        } else if (encoderStatus == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED) {
          // Should happen before receiving buffers, and should only happen once.
          // The MediaFormat contains the csd-0 and csd-1 keys, which we'll need
          // for MediaMuxer.  It's unclear what else MediaMuxer might want, so
          // rather than extract the codec-specific data and reconstruct a new
          // MediaFormat later, we just grab it here and keep it around.
          mEncodedFormat = mEncoder.getOutputFormat()
          Log.d(TAG, "encoder output format changed: " + mEncodedFormat)
        } else if (encoderStatus < 0) {
          Log.w(
            TAG,
            "unexpected result from encoder.dequeueOutputBuffer: " +
              encoderStatus
          )
          // let's ignore it
        } else {
          var encodedData: ByteBuffer? = mEncoder.getOutputBuffer(encoderStatus)
          if (encodedData == null) {
            throw RuntimeException(
              "encoderOutputBuffer " + encoderStatus +
                " was null"
            )
          }

          if ((mBufferInfo.flags and MediaCodec.BUFFER_FLAG_CODEC_CONFIG) != 0) {
            // The codec config data was pulled out when we got the
            // INFO_OUTPUT_FORMAT_CHANGED status.  The MediaMuxer won't accept
            // a single big blob -- it wants separate csd-0/csd-1 chunks --
            // so simply saving this off won't work.
            if (VERBOSE) Log.d(TAG, "ignoring BUFFER_FLAG_CODEC_CONFIG")
            mBufferInfo.size = 0
          }

          if (mBufferInfo.size != 0) {
            // adjust the ByteBuffer values to match BufferInfo (not needed?)
            encodedData.position(mBufferInfo.offset)
            encodedData.limit(mBufferInfo.offset + mBufferInfo.size)

            if (mVideoTrack == -1) {
              mVideoTrack = mMuxer.addTrack(mEncodedFormat!!)
              mMuxer.setOrientationHint(mOrientationHint)
              mMuxer.start()
              Log.d(TAG, "Started media muxer")
            }

            // mEncBuffer.add(encodedData, mBufferInfo.flags,
            //         mBufferInfo.presentationTimeUs)
            mMuxer.writeSampleData(mVideoTrack, encodedData, mBufferInfo)
            encodedFrame = true

            if (VERBOSE) {
              Log.d(
                TAG,
                "sent " + mBufferInfo.size + " bytes to muxer, ts=" +
                  mBufferInfo.presentationTimeUs
              )
            }
          }

          mEncoder.releaseOutputBuffer(encoderStatus, false)

          if ((mBufferInfo.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0) {
            Log.w(TAG, "reached end of stream unexpectedly")
            break // out of while
          }
        }
      }

      return encodedFrame
    }

    /**
     * Drains the encoder output.
     * <p>
     * See notes for {@link EncoderWrapper#frameAvailable()}.
     */
    fun frameAvailable() {
      if (VERBOSE) Log.d(TAG, "frameAvailable")
      if (drainEncoder()) {
        synchronized(mLock) {
          mFrameNum++
          mLock.notify()
        }
      }
    }

    /**
     * Tells the Looper to quit.
     */
    fun shutdown() {
      if (VERBOSE) Log.d(TAG, "shutdown")
      Looper.myLooper()!!.quit()
      mMuxer.stop()
      mMuxer.release()
    }

    /**
     * Handler for EncoderThread.  Used for messages sent from the UI thread (or whatever
     * is driving the encoder) to the encoder thread.
     * <p>
     * The object is created on the encoder thread.
     */
    public class EncoderHandler(et: EncoderThread) : Handler() {
      companion object {
        val MSG_FRAME_AVAILABLE: Int = 0
        val MSG_SHUTDOWN: Int = 1
      }

      // This shouldn't need to be a weak ref, since we'll go away when the Looper quits,
      // but no real harm in it.
      private val mWeakEncoderThread = WeakReference<EncoderThread>(et)

      // runs on encoder thread
      public override fun handleMessage(msg: Message) {
        val what: Int = msg.what
        if (VERBOSE) {
          Log.v(TAG, "EncoderHandler: what=" + what)
        }

        val encoderThread: EncoderThread? = mWeakEncoderThread.get()
        if (encoderThread == null) {
          Log.w(TAG, "EncoderHandler.handleMessage: weak ref is null")
          return
        }

        when (what) {
          MSG_FRAME_AVAILABLE -> encoderThread.frameAvailable()
          MSG_SHUTDOWN -> encoderThread.shutdown()
          else -> throw RuntimeException("unknown message " + what)
        }
      }
    }
  }
}
