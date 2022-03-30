import * as phoenix from "phoenix";
import Pubsub from "./common/pubsub";
import { Conversation } from "./conversation";
import { ConversationOptions } from "./types/conversation";
import { UhliveOptions } from "./types/uhlive";

export class Uhlive {
    private conversation: Conversation | null = null;
    private identifier: string;
    private options: UhliveOptions = {
        timeout: 3,
        url: "wss://api.uh.live",
    };
    private pubsub: Pubsub;
    private socket: phoenix.Socket;

    /**
     * Create an Uhlive instance by passing your private token and identifier.
     *
     * @example
     * ```js
     * const uhlive = new Uhlive("my-identifier", "my-token", {
     *   timeout: 3,
     * });
     * ```
     */
    constructor(identifier: string, token: string, options?: UhliveOptions) {
        this.identifier = identifier || "";
        this.options.url = options?.url || this.options.url;
        delete options?.url;
        this.options.timeout = options?.timeout || this.options.timeout;
        delete options?.timeout;

        this.pubsub = new Pubsub();

        this.socket = new phoenix.Socket(`${this.options.url}/socket`, {
            ...{ params: { timeout: this.options.timeout, token: token } },
            ...options,
        });

        this.socket.onError(() => {
            this.pubsub.publish("error");
        });

        this.socket.onClose(() => {
            this.pubsub.publish("close");
        });

        this.socket.onMessage((...args) => {
            const eventName = args[0].event as string | null;
            if (eventName && !eventName.startsWith("phx_")) {
                const conversationId = args[0].topic.split("@")[1];
                const payload = args[0].payload;

                if (
                    this.conversation &&
                    this.conversation.getId() === conversationId
                ) {
                    this.conversation.publish(eventName, payload);
                }
            }
        });
    }

    /**
     * Connect to the websocket.
     *
     * @example
     * ```js
     * const uhlive = new Uhlive("my-identifier", "my-token");
     * uhlive.connect();
     * ```
     */
    public connect(): Uhlive {
        this.socket.connect();
        return this;
    }

    /**
     * Disconnect from the websocket.
     *
     * @example
     * ```js
     * const uhlive = new Uhlive("my-identifier", "my-token");
     * uhlive.connect();
     * uhlive.join("my-conversation");
     * uhlive.disconnect().then(() => {
     *   console.log("Disconnected!");
     * });
     * ```
     */
    public async disconnect(): Promise<void> {
        if (this.conversation) {
            await this.conversation.leave();
            return await new Promise<void>((resolve) => {
                this.socket.disconnect(() => {
                    resolve();
                });
            });
        } else {
            return new Promise<void>((resolve) => {
                this.socket.disconnect(() => {
                    resolve();
                });
            });
        }
    }

    /**
     * Return the current conversation.
     *
     * @example
     * ```js
     * const uhlive = new Uhlive("my-identifier", "my-token");
     * uhlive.connect();
     * const conversation = uhlive.getConversation();
     * console.log(conversation);
     * ```
     */
    public getConversation(): Conversation | null {
        return this.conversation;
    }

    /**
     * Join a conversation and start recording immediately.
     *
     * @example
     * ```js
     * const uhlive = new Uhlive("my-identifier", "my-token");
     * uhlive.connect();
     * uhlive.join("my-conversation", {
     *   speaker: "john",
     * });
     * uhlive.disconnect();
     * ```
     * @example
     * ```js
     * const uhlive = new Uhlive("my-identifier", "my-token");
     * uhlive.connect();
     * uhlive.join("my-conversation", {
     *   ignoreEntities: ["NumberFound"],
     *   readonly: true,
     *   wrapper: "my-custom-wrapper",
     * });
     * uhlive.disconnect();
     * ```
     */
    public join(
        conversationId: string,
        options: ConversationOptions = {
            country: this.getCountryFromBrowser(),
            ignoreDecodingEvents: [],
            ignoreEntities: [],
            interim_results: true,
            model: this.getLocaleFromBrowser(),
            origin: 0,
            readonly: false,
            rescoring: true,
            speaker: Uhlive.generateSpeakerId(),
            wrapper: "uhlive",
        },
    ): Conversation {
        const defaultValues: Required<ConversationOptions> = {
            country: this.getCountryFromBrowser(),
            ignoreDecodingEvents: [],
            ignoreEntities: [],
            interim_results: true,
            model: this.getLocaleFromBrowser(),
            origin: 0,
            readonly: false,
            rescoring: true,
            speaker: Uhlive.generateSpeakerId(),
            wrapper: "uhlive",
        };
        const newOptions: Required<ConversationOptions> = {
            ...defaultValues,
            ...options,
        };

        if (this.conversation) {
            throw new Error(
                "You already joined a conversation. Open a new connection to create or join a new conversation.",
            );
        }

        const conversation = new Conversation(
            conversationId,
            this.identifier,
            this.socket,
            newOptions,
        );

        this.conversation = conversation;
        return conversation;
    }

    /**
     * Leave a conversation.
     *
     * @example
     * ```js
     * const uhlive = new Uhlive("my-identifier", "my-token");
     * uhlive.connect();
     * uhlive.join("my-conversation");
     * uhlive.leave().then(() => {
     *     console.log("You left the conversation");
     * }).catch((err) => {
     *     console.error("Error:", err);
     * });
     * ```
     */
    public leave(): Promise<void> {
        if (this.conversation) {
            return this.conversation.leave().then(() => {
                this.conversation = null;
            });
        } else {
            return new Promise((_resolve, reject) =>
                reject("You must join a conversation before leaving it."),
            );
        }
    }

    /**
     * Leave all conversations at once.
     *
     * @deprecated
     * @example
     * ```js
     * const uhlive = new Uhlive("my-identifier", "my-token");
     * uhlive.connect();
     * uhlive.join("my-conversation1");
     * uhlive.join("my-conversation2");
     * uhlive.leaveAllConversations().then((result) => {
     *     result.forEach((msg) => {
     *         console.log("Promise result", msg);
     *     });
     * });
     * uhlive.disconnect();
     * ```
     */
    public leaveAllConversations(): Promise<void[]> {
        console.warn("This function is deprecated and will be removed soon.");
        return Promise.all([this.leave()]);
    }

    /**
     * Subscribe to Uhlive `onClose` event.
     *
     * @category Events
     * @example
     * ```js
     * const uhlive = new Uhlive("my-identifier", "my-token");
     * uhlive.onClose(() => {
     *   // Choose what to do when the connection is closed.
     * });
     * ```
     */
    public onClose(callback: () => void): Uhlive {
        this.pubsub.subscribe("close", callback);
        return this;
    }

    /**
     * Subscribe to Uhlive `onError` event.
     *
     * @category Events
     * @example
     * ```js
     * const uhlive = new Uhlive("my-identifier", "my-token");
     * uhlive.onError(() => {
     *   // Choose what to do when we encounter an error.
     * });
     * ```
     */
    public onError(callback: () => void): Uhlive {
        this.pubsub.subscribe("error", callback);
        return this;
    }

    private static generateSpeakerId() {
        return Math.random()
            .toString(36)
            .replace(/[^a-z]+/g, "");
    }

    private getBrowserLanguagesAndCountries() {
        let locales =
            navigator.languages === undefined
                ? [navigator.language]
                : navigator.languages;

        // Get only the locales with the country part (eg: "en-US", "fr-FR")
        return locales.filter((l) => l.includes("-"));
    }

    private getCountryFromBrowser() {
        const countries = this.getBrowserLanguagesAndCountries()
            .map((pair, key, arr) => {
                const country = pair.split("-")[1];
                if (country) {
                    return country.toLowerCase();
                }
                delete arr[key];
            })
            .filter((c) => !!c && Conversation.validCountries.has(c));

        if (countries.length) {
            return countries[0] as string;
        }
        return Conversation.defaultCountry;
    }

    private getLocaleFromBrowser() {
        const locales = this.getBrowserLanguagesAndCountries()
            .map((pair) => pair.split("-")[0].toLowerCase())
            .filter((l) => Conversation.validModels.has(l));

        if (locales.length) {
            return locales[0] as string;
        }
        return Conversation.defaultModel;
    }
}

export { DecodingEvent, EntityEvent } from "./types/conversation";

export type {
    ConversationOptions,
    Entity,
    EntityAnnotation,
    SegmentDecoded,
    SegmentDecodedWord,
    SpeakerJoined,
    SpeakerLeft,
    WordsDecoded,
} from "./types/conversation";
