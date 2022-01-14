// @ts-ignore
import recorderWorkerHtml from "./recorderWorker.html";
import { RecorderConfig } from "./types/recorder";
const recorderWorker = recorderWorkerHtml.replace(/<\/?script>/g, "");

export default class Recorder {
    private bufferLen: number;
    private config: RecorderConfig | undefined;
    private context: BaseAudioContext;
    private currCallback: Function;
    private node: ScriptProcessorNode;
    private recording: boolean;
    private worker: Worker;

    constructor(source: MediaStreamAudioSourceNode, config?: RecorderConfig) {
        this.bufferLen = config?.bufferLen || 4096;
        this.context = source.context;
        this.node = this.context.createScriptProcessor(this.bufferLen, 1, 1);
        this.config = config;
        this.recording = false;
        this.currCallback = (): void => {
            return;
        };

        this.worker = new Worker(
            URL.createObjectURL(
                new Blob([recorderWorker], {
                    type: "application/javascript",
                }),
            ),
        );
        this.worker.postMessage({
            command: "init",
            config: {
                fromSampleRate: this.context.sampleRate,
                toSampleRate: 8000,
            },
        });

        this.node.onaudioprocess = (e): void => {
            if (!this.recording) return;
            this.worker.postMessage({
                buffer: [e.inputBuffer.getChannelData(0)],
                command: "record",
            });
        };

        this.worker.onmessage = (e): void => {
            this.currCallback(e.data);
        };

        source.connect(this.node);
        this.node.connect(this.context.destination);
    }

    public clear(): void {
        this.worker.postMessage({ command: "clear" });
    }

    public exportAudio(cb: Function, type: string): void {
        this.currCallback = cb || this.config?.callback;
        type = type || this.config?.type || "audio/raw";
        if (!this.currCallback) throw new Error("Callback not set");
        this.worker.postMessage({
            command: "exportAudio",
            type: type,
        });
    }

    public getBuffer(cb: Function): void {
        this.currCallback = cb || this.config?.callback;
        this.worker.postMessage({ command: "getBuffer" });
    }

    public record(): void {
        this.recording = true;
    }

    public stop(): void {
        this.recording = false;
    }
}
