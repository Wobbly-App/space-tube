import { MatrixClient } from "../client";
export declare class MediaHandler {
    private client;
    private audioInput;
    private videoInput;
    private localUserMediaStream?;
    userMediaStreams: MediaStream[];
    screensharingStreams: MediaStream[];
    constructor(client: MatrixClient);
    /**
     * Set an audio input device to use for MatrixCalls
     * @param {string} deviceId the identifier for the device
     * undefined treated as unset
     */
    setAudioInput(deviceId: string): Promise<void>;
    /**
     * Set a video input device to use for MatrixCalls
     * @param {string} deviceId the identifier for the device
     * undefined treated as unset
     */
    setVideoInput(deviceId: string): Promise<void>;
    /**
     * Requests new usermedia streams and replace the old ones
     */
    updateLocalUsermediaStreams(): Promise<void>;
    hasAudioDevice(): Promise<boolean>;
    hasVideoDevice(): Promise<boolean>;
    /**
     * @param audio should have an audio track
     * @param video should have a video track
     * @param reusable is allowed to be reused by the MediaHandler
     * @returns {MediaStream} based on passed parameters
     */
    getUserMediaStream(audio: boolean, video: boolean, reusable?: boolean): Promise<MediaStream>;
    /**
     * Stops all tracks on the provided usermedia stream
     */
    stopUserMediaStream(mediaStream: MediaStream): void;
    /**
     * @param desktopCapturerSourceId sourceId for Electron DesktopCapturer
     * @param reusable is allowed to be reused by the MediaHandler
     * @returns {MediaStream} based on passed parameters
     */
    getScreensharingStream(desktopCapturerSourceId: string, reusable?: boolean): Promise<MediaStream | null>;
    /**
     * Stops all tracks on the provided screensharing stream
     */
    stopScreensharingStream(mediaStream: MediaStream): void;
    /**
     * Stops all local media tracks
     */
    stopAllStreams(): void;
    private getUserMediaContraints;
    private getScreenshareContraints;
}
//# sourceMappingURL=mediaHandler.d.ts.map