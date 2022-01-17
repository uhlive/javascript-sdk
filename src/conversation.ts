import * as Phoenix from "phoenix";
import Pubsub from "./common/pubsub";
import Recorder from "./recorder";
import {
    ConversationOptions,
    DecodingEvent,
    EntitiesRelationEvent,
    Entity,
    EntityEvent,
    EntityRef,
    SegmentDecoded,
    SegmentDecodedWord,
    SpeakerJoined,
    SpeakerLeft,
    TagsFound,
    WordsDecoded,
} from "./types/conversation";

export class Conversation {
    private audioContext: AudioContext | undefined;
    private audioInterval = 250;
    private audioSendInterval!: number;
    private audioSourceConstraints: MediaStreamConstraints = { audio: true };
    private channel: Phoenix.Channel;
    private conversationId: string;
    public static readonly defaultCountry = "us";
    public static readonly defaultModel = "en";
    private messageList: WordsDecoded[] | SegmentDecoded[] = [];
    private pubsub: Pubsub;
    private recorder!: Recorder | null;
    private socket: Phoenix.Socket;
    public readonly speaker: string;
    private speakerList: string[] = [];
    public static readonly validCountries = new Set(["fr", "us"]); // This needs to be updated each time we add a new country.
    public static readonly validModels = new Set(["es", "fr", "en"]); // This needs to be updated each time we add a public model.
    private wrapper: string = "";

    /**
     * @ignore
     */
    constructor(
        conversationId: string,
        identifier: string,
        socket: Phoenix.Socket,
        options: Required<ConversationOptions>,
    ) {
        this.conversationId = conversationId;
        this.socket = socket;
        this.speaker = options.speaker;
        this.wrapper = options.wrapper;

        this.validateConstructorParameters(conversationId, identifier, options);

        this.pubsub = new Pubsub();

        this.channel = this.socket.channel(
            `conversation:${identifier}@${conversationId}`,
            options,
        );
        this.channel.onError(() => {
            this.pubsub.publish(
                "error",
                "There was an error with the conversation!",
            );
        });
        this.channel.onClose(() => {
            this.pubsub.publish("close");
        });

        this.pubsub.subscribe("words_decoded", (payload: WordsDecoded) => {
            this.addSpeaker(payload.speaker);
        });
        this.pubsub.subscribe("segment_decoded", (payload: WordsDecoded) => {
            this.addSpeaker(payload.speaker);
        });

        if (document.getElementById(this.wrapper)) {
            if (
                !options.ignoreDecodingEvents.includes(
                    DecodingEvent.WordsDecoded,
                )
            ) {
                this.pubsub.subscribe(
                    "words_decoded",
                    (payload: WordsDecoded) => {
                        this.addSpeaker(payload.speaker);
                        this.addOrUpdateMessage(payload);
                    },
                );
            }
            if (
                !options.ignoreDecodingEvents.includes(
                    DecodingEvent.SegmentDecoded,
                )
            ) {
                this.pubsub.subscribe(
                    "segment_decoded",
                    (payload: WordsDecoded) => {
                        this.addSpeaker(payload.speaker);
                        this.addOrUpdateMessage(payload);
                    },
                );
            }

            this.listenToEntityEvents(options.ignoreEntities);
        }

        this.channel.join().receive("error", ({ reason }) => {
            this.pubsub.publish("error", reason);
        });

        if (!options.readonly) {
            this.startRecording();
        }
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
     *
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

    /**
     * @ignore
     */
    public leave(): Promise<void> {
        return new Promise<void>((resolve) => {
            if (this.isRecording()) {
                this.stopRecording();
            }
            this.pubsub.subscribe(`speaker_left`, (payload) => {
                if (payload.speaker === this.speaker) {
                    resolve();
                }
            });
            this.channel.leave();
        });
    }

    /**
     * Subscribe to Conversation `onClose` event.
     *
     * @category Events
     * @example
     * ```js
     * const uhlive = new Uhlive("my-token");
     * const conversation = uhlive.join("test");
     * conversation.onClose(() => {
     *   // Choose what to do when the conversation is closed.
     * })
     * ```
     */
    public onClose(callback: () => void): Conversation {
        this.pubsub.subscribe("close", callback);
        return this;
    }

    /**
     * This event is triggered when the specified entity has been found or the wildcard is used and any entity is found.
     *
     * @category Events
     * @example
     * ```js
     * const uhlive = new Uhlive("my-token");
     * const myConversation = uhlive.join("my-conversation");
     * myConversation.onEntityFound("LocationCity", (entity) => {
     *     // Do something with `entity`...
     * });
     * ```
     */
    public onEntityFound(
        entityName: EntityEvent | "*",
        callback: (entity: Entity, entityName: EntityEvent) => void,
    ): Conversation {
        if (entityName === "*") {
            Object.values(EntityEvent).forEach((entity) => {
                this.onEntityFound(entity, callback);
            });
        } else if (Object.values(EntityEvent).includes(entityName)) {
            const eventName = `entity${entityName
                .replace(/([A-Z])/g, `_$1`)
                .toLowerCase()}_found`;

            this.pubsub.subscribe(eventName, callback);
        } else {
            throw new Error(
                `Invalid entity name (valid entity names are: ${Object.values(
                    EntityEvent,
                ).join(", ")}).`,
            );
        }

        return this;
    }

    /**
     * This event is triggered when an entity with possible relations is found.
     * It is emitted event if only one entity is found.
     *
     * @category Events
     * @example
     * ```js
     * const uhlive = new Uhlive("my-token");
     * const myConversation = uhlive.join("my-conversation");
     * myConversation.onEntityRelationFound("CreditCard", (relation) => {
     *     // Do something with `relation`...
     * });
     * ```
     */
    public onEntityRelationFound(
        relationName: EntitiesRelationEvent | "*",
        callback: (entities: EntityRef[]) => void,
    ): Conversation {
        if (relationName === "*") {
            Object.values(EntitiesRelationEvent).forEach((relation) => {
                this.onEntityRelationFound(relation, callback);
            });
        } else if (
            Object.values(EntitiesRelationEvent).includes(relationName)
        ) {
            const eventName = `relation${relationName
                .replace(/([A-Z])/g, `_$1`)
                .toLowerCase()}_found`;

            this.pubsub.subscribe(eventName, callback);
        } else {
            throw new Error(
                `Invalid entities relation (valid relations names are: ${Object.values(
                    EntitiesRelationEvent,
                ).join(", ")}).`,
            );
        }

        return this;
    }

    /**
     * Subscribe to Conversation `onError` event.
     *
     * @category Events
     * @example
     * ```js
     * const uhlive = new Uhlive("my-token");
     * const conversation = uhlive.join("test");
     * conversation.onError((msg) => console.log(msg))
     * ```
     */
    public onError(callback: (payload: any) => void): Conversation {
        this.pubsub.subscribe("error", callback);
        return this;
    }

    /**
     * The `onSegmentDecoded` event is triggered when a final transcript is received.
     *
     * @category Events
     * @example
     * ```js
     * const uhlive = new Uhlive("my-token");
     * const myConversation = uhlive.join("my-conversation");
     * myConversation.onSegmentDecoded((transcript) => {
     *     // Do something with `transcript`...
     * });
     * ```
     */
    public onSegmentDecoded(
        callback: (transcript: SegmentDecoded) => void,
    ): Conversation {
        this.pubsub.subscribe("segment_decoded", callback);

        return this;
    }

    /**
     * The `speaker_joined` event is triggered when a speaker join the conversation. It is sent to everyone except the speaker itself. Note that users connected in read-only mode (observers) don't emit this event.
     *
     * @category Events
     * @example
     * ```js
     * const uhlive = new Uhlive("my-token");
     * const myConversation = uhlive.join("my-conversation");
     * myConversation.onSpeakerJoined((payload) => {
     *     // Do something with `payload`...
     * });
     * ```
     */
    public onSpeakerJoined(
        callback: (payload: SpeakerJoined) => void,
    ): Conversation {
        this.pubsub.subscribe("speaker_joined", callback);

        return this;
    }

    /**
     * The `speaker_left` event is triggered when a speaker leaves, or more abruptly, closes its connection. This event is published after all remaining transcript events of this speaker have been published. Note that users connected in read-only mode (observers) don't emit this event.
     *
     * @category Events
     * @example
     * ```js
     * const uhlive = new Uhlive("my-token");
     * const myConversation = uhlive.join("my-conversation");
     * myConversation.onSpeakerLeft((speaker) => {
     *     // Do something with `speaker`...
     * });
     * ```
     */
    public onSpeakerLeft(
        callback: (payload: SpeakerLeft) => void,
    ): Conversation {
        this.pubsub.subscribe("speaker_left", callback);

        return this;
    }

    /**
     * The `tags_found` event is triggered when a tag is found for the current conversation
     *
     * @category Events
     *
     * @example
     * ```js
     * const uhlive = new Uhlive("my-token");
     * const myConversation = uhlive.join("my-conversation");
     * myConversation.onWordsDecoded((transcript) => {
     *     // Do something with `transcript`...
     * });
     * ```
     */
    public onTagsFound(callback: (payload: TagsFound) => void): Conversation {
        this.pubsub.subscribe("tags_found", callback);

        return this;
    }

    /**
     * The `words_decoded` event is triggered when an interim transcript is received. Following `words_decoded` events for the same audio are susceptible to be different, until a final transcript is sent with the `segment_decoded` event.
     *
     * @category Events
     * @example
     * ```js
     * const uhlive = new Uhlive("my-token");
     * const myConversation = uhlive.join("my-conversation");
     * myConversation.onWordsDecoded((transcript) => {
     *     // Do something with `transcript`...
     * });
     * ```
     */
    public onWordsDecoded(
        callback: (transcript: WordsDecoded) => void,
    ): Conversation {
        this.pubsub.subscribe("words_decoded", callback);

        return this;
    }

    /**
     * Publish an event for the current conversation.
     *
     * @example
     * ```js
     * const uhlive = new Uhlive("my-token");
     * const conversation = uhlive.join("my-conversation");
     * conversation.publish("my-event", {payload: "bob"});
     * ```
     */
    public publish(eventName: string, payload?: any, context?: any) {
        this.pubsub.publish(eventName, payload, context);
    }

    private addEntityToMessage(entity: Entity, entityType: EntityEvent) {
        // Get the message in which the entity is present
        const messageContainingEntityIndex = this.messageList.findIndex(
            (message) =>
                message.speaker === entity.speaker &&
                message.start <= entity.start &&
                message.end >= entity.end,
        );

        // Check which words should be replaced by the entity
        const wordsToReplace: number[] = [];
        this.messageList[messageContainingEntityIndex].words.forEach(
            (word: SegmentDecodedWord, wordIndex: number) => {
                if (word.start >= entity.start && word.end <= entity.end) {
                    wordsToReplace.push(wordIndex);
                }
            },
        );

        // Replace the word(s) in the transcript
        const regex = new RegExp(`\\b${entity.annotation.original}\\b`);
        this.messageList[
            messageContainingEntityIndex
        ].transcript = this.messageList[
            messageContainingEntityIndex
        ].transcript.replace(
            regex,
            `<span class="entity entity-${entityType.toLowerCase()}">${
                entity.annotation.canonical ?? entity.annotation.original
            }</span>`,
        );

        // Replace the first word by the one from the entity
        (this.messageList[messageContainingEntityIndex].words[
            wordsToReplace[0]
        ] as SegmentDecodedWord) = {
            confidence: this.messageList[messageContainingEntityIndex].words[
                wordsToReplace[0]
            ].confidence,
            end: entity.end,
            length: entity.length,
            start: entity.start,
            word: entity.annotation.canonical ?? entity.annotation.original,
        };

        // Remove the following words if any
        this.messageList[messageContainingEntityIndex].words.splice(
            wordsToReplace[1],
            wordsToReplace.length - 1,
        );

        this.addOrUpdateMessage(this.messageList[messageContainingEntityIndex]);
    }

    private addOrUpdateMessage(message: WordsDecoded | SegmentDecoded) {
        const wrapper = document.getElementById(this.wrapper);
        if (wrapper) {
            const messageExists = this.messageList.find((m) => {
                return m.utterance_id === message.utterance_id;
            });

            if (messageExists) {
                const messageToUpdateIndex = this.messageList.findIndex(
                    (m) => m.utterance_id === message.utterance_id,
                );
                if (messageToUpdateIndex !== -1) {
                    this.messageList[messageToUpdateIndex] = message;
                }
            } else {
                this.messageList.push(message);
            }

            const speakerId = this.speakerList.indexOf(message.speaker) + 1;
            const segmentId = speakerId + message.utterance_id;
            let msgElm = document.getElementById(`uh-segment-${segmentId}`);
            if (!msgElm) {
                msgElm = document.createElement("div");
                msgElm.id = `uh-segment-${segmentId}`;
            }
            msgElm.innerHTML = message.transcript;
            msgElm.classList.add("uh-segment");
            msgElm.classList.add(`uh-speaker-${speakerId}`);
            wrapper.appendChild(msgElm);
        } else {
            throw new Error(`Wrapper "${this.wrapper}" not found.`);
        }
    }

    private addSpeaker(speaker: string): void {
        if (!this.speakerList.includes(speaker)) {
            this.speakerList.push(speaker);
        }
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

    private listenToEntityEvents(eventsToIgnore: EntityEvent[]) {
        Object.values(EntityEvent).forEach((entityName) => {
            if (!eventsToIgnore.includes(entityName)) {
                const eventName = `entity${entityName
                    .replace(/([A-Z])/g, `_$1`)
                    .toLowerCase()}_found`;
                this.pubsub.subscribe(eventName, (entity: Entity) => {
                    this.addEntityToMessage(entity, entityName);
                });
            }
        });
    }

    private sendMessage(event: string, payload = {}): void {
        this.channel
            .push(event, payload)
            .receive("error", (data: any) =>
                console.error("response ERROR", data),
            );
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

    private async startRecording() {
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

    private stopRecording(): Conversation | null {
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

    private validateConstructorParameters(
        conversationId: string,
        identifier: string,
        options: ConversationOptions,
    ) {
        if (typeof conversationId !== "string" || conversationId.length === 0) {
            throw new Error(
                `Invalid parameter "conversationId". It must be a string with a length > 0.`,
            );
        }

        if (typeof identifier !== "string" || identifier.length === 0) {
            throw new Error(
                `Invalid parameter "identifier". It must be a string with a length > 0.`,
            );
        }

        if (
            Object.prototype.hasOwnProperty.call(options, "interim_results") &&
            typeof options.interim_results !== "boolean"
        ) {
            throw new Error(
                `Invalid parameter "interim_results". It must be a boolean.`,
            );
        }

        if (
            Object.prototype.hasOwnProperty.call(options, "model") &&
            (typeof options.model !== "string" || options.model.length === 0)
        ) {
            throw new Error(
                `Invalid parameter "model". It must be a string with a length > 0.`,
            );
        }

        if (
            Object.prototype.hasOwnProperty.call(options, "readonly") &&
            typeof options.readonly !== "boolean"
        ) {
            throw new Error(
                `Invalid parameter "readonly". It must be a boolean.`,
            );
        }

        if (
            Object.prototype.hasOwnProperty.call(options, "rescoring") &&
            typeof options.rescoring !== "boolean"
        ) {
            throw new Error(
                `Invalid parameter "rescoring". It must be a boolean.`,
            );
        }

        if (
            Object.prototype.hasOwnProperty.call(options, "speaker") &&
            (typeof options.speaker !== "string" ||
                options.speaker.length === 0)
        ) {
            throw new Error(
                `Invalid parameter "speaker". It must be a string with a length > 0.`,
            );
        }

        if (
            Object.prototype.hasOwnProperty.call(
                options,
                "ignoreDecodingEvents",
            ) &&
            !Array.isArray(options.ignoreDecodingEvents)
        ) {
            throw new Error(
                `Invalid parameter "ignoreDecodingEvents". It must be an array.`,
            );
        }

        if (
            Object.prototype.hasOwnProperty.call(options, "ignoreEntities") &&
            !Array.isArray(options.ignoreEntities)
        ) {
            throw new Error(
                `Invalid parameter "ignoreEntities". It must be an array.`,
            );
        }
    }
}
