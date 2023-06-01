import * as Phoenix from "phoenix";
import Recorder from "./recorder";

export class AudioSource {
    private audioContext: AudioContext | undefined;
    private audioInterval = 250;
    private audioSendInterval!: number;
    private audioSourceConstraints: MediaStreamConstraints = { audio: true };
    private recorder!: Recorder | null;
    private channel: Phoenix.Channel;
    private socket: Phoenix.Socket;

    constructor(channel: Phoenix.Channel, socket: Phoenix.Socket) {
        this.channel = channel;
        this.socket = socket;
    }

    public async startRecording() {
        console.log("Recording audio");
        let stream: MediaStream;
        try {
            stream = await this.askForPermissions();
        } catch (e) {
            throw new Error(
                "Impossible to get permission to access microphone: " + e,
            );
        }

        try {
            this.audioContext = new AudioContext();
            this.audioContext.resume();

            const input = this.audioContext.createMediaStreamSource(stream);
            input.connect(this.audioContext.createAnalyser());

            this.recorder = new Recorder(input);

            this.audioSendInterval = window.setInterval(() => {
                if (this.recorder) {
                    this.recorder.exportAudio((blob: Blob) => {
                        this.socketSend(blob);
                        this.recorder!.clear();
                    }, "audio/x-raw");
                }
            }, this.audioInterval);
            this.recorder.record();
        } catch (e) {
            throw new Error("Error initializing Web Audio browser: " + e);
        }
    }

    public startRecordingIncoming() {
        console.log("Recording incoming audio");
        return navigator.mediaDevices
        .getDisplayMedia({video: true, audio: true})
        .then((stream) => {
            try {
                this.audioContext = new AudioContext();
                this.audioContext.resume();

                const input = this.audioContext.createMediaStreamSource(stream);
                input.connect(this.audioContext.createAnalyser());

                this.recorder = new Recorder(input);

                this.audioSendInterval = window.setInterval(() => {
                    if (this.recorder) {
                        this.recorder.exportAudio((blob: Blob) => {
                            this.socketSend(blob);
                            this.recorder!.clear();
                        }, "audio/x-raw");
                    }
                }, this.audioInterval);
                this.recorder.record();
            } catch (e) {
                throw new Error("Error initializing Web Audio browser: " + e);
            }
        })
        .catch((err) => {
          console.error(err);
          return null;
        });
    }

    private askForPermissions(): Promise<any> {
        if (navigator.mediaDevices.getUserMedia) {
            return navigator.mediaDevices.getUserMedia(
                this.audioSourceConstraints,
            );
        } else {
            return new Promise((reject) => {
                reject(new Error("No user media support"));
            });
        }
    }

    public stopRecording(): AudioSource | null {
        if (this.isRecording()) {
            clearInterval(this.audioSendInterval);
            this.recorder!.stop();
            this.recorder!.clear();
            this.recorder!.exportAudio((blob: Blob) => {
                this.socketSend(blob);
                this.recorder!.clear();
                this.recorder = null;
            }, "audio/x-raw");
            return this;
        }
        console.warn("You must start to record before being able to stop.");
        return null;
    }

    /**
     * Get the recording status of the conversation.
     *
     * @category Recording
     * @example
     * ```javascript
     * const uhlive = new Uhlive("my-token");
     * uhlive
     *     .join("my-conversation")
     *     .isRecording(); // true
     * ```
     * @example
     * ```js
     * const uhlive = new Uhlive("my-token");
     * uhlive
     *     .join("my-conversation", {readonly: true})
     *     .isRecording(); // false
     * ```
     */
    public isRecording(): boolean {
        return Boolean(this.recorder);
    }

    private socketSend(item: Blob | string) {
        if (this.socket) {
            const state = this.socket.connectionState();
            if (state == "open") {
                // If item is an audio blob
                if (item instanceof Blob) {
                    if (item.size > 0) {
                        const reader = new FileReader();
                        reader.readAsDataURL(item);
                        reader.onloadend = () => {
                            this.sendMessage("audio_chunk", {
                                blob: (reader.result as string).replace(
                                    "data:audio/x-raw;base64,",
                                    "",
                                ),
                            });
                        };
                    }
                }
            } else {
                console.error(`Socket is not in "open" state`);
            }
        }
    }

    private sendMessage(event: string, payload = {}): void {
        this.channel
            .push(event, payload)
            .receive("error", (data: any) =>
                console.error("response ERROR", data),
            );
    }
}
