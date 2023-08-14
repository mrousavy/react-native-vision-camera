/**
 * Indicates the quality level or bit rate of the output.
 *
 * * `"cif-352x288"`: Specifies capture settings suitable for CIF quality (352 x 288 pixel) video output
 * * `"hd-1280x720"`: Specifies capture settings suitable for 720p quality (1280 x 720 pixel) video output.
 * * `"hd-1920x1080"`: Capture settings suitable for 1080p-quality (1920 x 1080 pixels) video output.
 * * `"hd-3840x2160"`: Capture settings suitable for 2160p-quality (3840 x 2160 pixels, "4k") video output.
 * * `"high"`: Specifies capture settings suitable for high-quality video and audio output.
 * * `"iframe-1280x720"`: Specifies capture settings to achieve 1280 x 720 quality iFrame H.264 video at about 40 Mbits/sec with AAC audio.
 * * `"iframe-960x540"`: Specifies capture settings to achieve 960 x 540 quality iFrame H.264 video at about 30 Mbits/sec with AAC audio.
 * * `"input-priority"`: Specifies that the capture session does not control audio and video output settings.
 * * `"low"`: Specifies capture settings suitable for output video and audio bit rates suitable for sharing over 3G.
 * * `"medium"`: Specifies capture settings suitable for output video and audio bit rates suitable for sharing over WiFi.
 * * `"photo"`: Specifies capture settings suitable for high-resolution photo quality output.
 * * `"vga-640x480"`: Specifies capture settings suitable for VGA quality (640 x 480 pixel) video output.
 */
export declare type CameraPreset = 'cif-352x288' | 'hd-1280x720' | 'hd-1920x1080' | 'hd-3840x2160' | 'high' | 'iframe-1280x720' | 'iframe-960x540' | 'input-priority' | 'low' | 'medium' | 'photo' | 'vga-640x480';
