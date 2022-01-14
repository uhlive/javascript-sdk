/**
 * Optional parameters for Uhlive class constructor.
 */
export interface UhliveOptions {
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
