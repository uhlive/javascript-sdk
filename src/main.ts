import * as phoenix from "phoenix";
import Pubsub from "./common/pubsub";
import { Conversation } from "./conversation";
import { ConversationOptions } from "./types/conversation";
import { UhliveOptions } from "./types/uhlive";

export class Uhlive {
    public readonly conversations: Map<string, Conversation> = new Map();
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

                const existingConversation = this.conversations.get(
                    conversationId,
                );
                if (existingConversation) {
                    existingConversation.publish(eventName, payload);
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
    public disconnect(): Promise<void> {
        return this.leaveAllConversations().then(() => {
            return new Promise<void>((resolve) => {
                this.socket.disconnect(() => {
                    resolve();
                });
            });
        });
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
     *
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

        const existingConversation = this.conversations.get(conversationId);
        if (existingConversation) {
            console.warn(
                `You already joined conversation "${conversationId}".`,
            );
            return existingConversation;
        }

        const conversation = new Conversation(
            conversationId,
            this.identifier,
            this.socket,
            newOptions,
        );

        this.conversations.set(conversationId, conversation);
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
     * uhlive.leave("my-conversation").then(() => {
     *     console.log("You left the conversation");
     * }).catch((err) => {
     *     console.error("Error:", err);
     * });
     * ```
     */
    public leave(conversationId: string): Promise<void> {
        if (this.conversations.has(conversationId)) {
            return this.conversations
                .get(conversationId)!
                .leave()
                .then(() => {
                    this.conversations.delete(conversationId);
                });
        } else {
            return new Promise((_resolve, reject) =>
                reject(`Unknown conversationId "${conversationId}".`),
            );
        }
    }

    /**
     * Leave all conversations at once.
     *
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
        const conversationsLeft: Promise<void>[] = [];
        this.conversations.forEach((conversation) => {
            conversationsLeft.push(conversation.leave());
        });
        return Promise.all(conversationsLeft);
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
