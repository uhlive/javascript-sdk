/**
 * Optional parameters for Uhlive class constructor.
 */
export interface UhliveOptions {
    /**
     * Capture audio incoming from speakers.
     */
    captureIncomingAudio?: boolean;
    /**
     * The delay until disconnection, in seconds.
     */
    timeout?: number;
    /**
     * The Uhlive backend URL.
     *
     * @ignore
     * @description Don't change that except if you're an Allomedia developer.
     */
    url?: string;
}

export interface UhliveConfig extends UhliveOptions {
    identifier: string;
    jwtToken: string;
}
