import type { CameraCaptureError } from './CameraError';
import type { TemporaryFile } from './TemporaryFile';
export declare type VideoFileType = 'mov' | 'avci' | 'm4v' | 'mp4';
export declare type CameraVideoCodec = 'h264' | 'hevc' | 'hevc-alpha' | 'jpeg' | 'pro-res-4444' | 'pro-res-422' | 'pro-res-422-hq' | 'pro-res-422-lt' | 'pro-res-422-proxy';
export interface RecordVideoOptions {
    /**
     * Set the video flash mode. Natively, this just enables the torch while recording.
     */
    flash?: 'on' | 'off' | 'auto';
    /**
     * Sets the file type to use for the Video Recording.
     * @default "mov"
     */
    fileType?: VideoFileType;
    /**
     * Called when there was an unexpected runtime error while recording the video.
     */
    onRecordingError: (error: CameraCaptureError) => void;
    /**
     * Called when the recording has been successfully saved to file.
     */
    onRecordingFinished: (video: VideoFile) => void;
    /**
     * Set the video codec to record in. Different video codecs affect video quality and video size.
     * To get a list of all available video codecs use the `getAvailableVideoCodecs()` function.
     *
     * @default undefined
     * @platform iOS
     */
    videoCodec?: CameraVideoCodec;
}
/**
 * Represents a Video taken by the Camera written to the local filesystem.
 *
 * Related: {@linkcode Camera.startRecording | Camera.startRecording()}, {@linkcode Camera.stopRecording | Camera.stopRecording()}
 */
export interface VideoFile extends TemporaryFile {
    /**
     * Represents the duration of the video, in seconds.
     */
    duration: number;
}
