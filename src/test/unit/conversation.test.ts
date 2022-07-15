import * as Phoenix from "phoenix";
import { Conversation } from "../../conversation";
import { EntityEvent, EntitiesRelationEvent } from "../../types/conversation";

console.error = jest.fn();

describe("Conversation", () => {
    let conversation: Conversation;
    let spyOnStartRecording: any;
    let spyOnStopRecording: any;

    beforeEach(() => {
        jest.clearAllMocks();

        spyOnStartRecording = jest.spyOn(
            Conversation.prototype as any,
            "startRecording",
        );
        spyOnStartRecording.mockImplementation(() => {
            return new Promise((resolve) => {
                resolve({
                    message: "whatever",
                    status: "success",
                });
            });
        });

        spyOnStopRecording = jest.spyOn(
            Conversation.prototype as any,
            "stopRecording",
        );
        spyOnStopRecording.mockImplementation(() => {
            return new Promise((resolve) => {
                resolve({
                    message: "whatever",
                    status: "success",
                });
            });
        });

        conversation = new Conversation(
            "my-conversation",
            "my-identifier",
            new Phoenix.Socket("super-url", {
                params: { timeout: 3, token: "xxx" },
            }),
            {
                country: "fr",
                ignoreDecodingEvents: [],
                ignoreEntities: [],
                interim_results: true,
                model: "en",
                origin: 0,
                readonly: false,
                rescoring: true,
                speaker: "me",
                wrapper: "",
            },
        );
        // @ts-ignore
        conversation["recorder"] = new Object();
    });

    afterEach(() => {
        conversation.leave();
    });

    it("should create a new instance", () => {
        expect(conversation).toBeInstanceOf(Conversation);
    });

    it("should return true if recording", () => {
        expect(conversation.isRecording()).toBe(true);
        expect(spyOnStartRecording).toHaveBeenCalledTimes(1);
    });

    it("should leave", async () => {
        const leave = conversation.leave();
        conversation.publish("speaker_left", { speaker: "me" });
        await expect(leave).resolves.toBe(undefined);
        expect(spyOnStopRecording).toHaveBeenCalledTimes(1);
        // @ts-ignore
        // eslint-disable-next-line import/namespace
        expect(Phoenix.mockPhoenixChannelLeave).toHaveBeenCalledTimes(1);
    });

    it("should execute callback if event 'close' is triggered", () => {
        const cb = jest.fn();
        expect(conversation.onClose(cb)).toBeInstanceOf(Conversation);
        conversation.publish("close");
        expect(cb).toHaveBeenCalledTimes(1);
    });

    it("should execute callback if event 'entity_*_found' is triggered", () => {
        const cb = jest.fn();
        expect(
            conversation.onEntityFound(EntityEvent.LocationCity, cb),
        ).toBeInstanceOf(Conversation);
        conversation.publish("entity_location_city_found");
        expect(cb).toHaveBeenCalledTimes(1);
    });

    it("should execute callback if event 'entity_*_found' is triggered while subscribing to wildcard", () => {
        const cb = jest.fn();
        expect(conversation.onEntityFound("*", cb)).toBeInstanceOf(
            Conversation,
        );
        conversation.publish("entity_location_city_found");
        expect(cb).toHaveBeenCalledTimes(1);
    });

    it("should execute callback if event 'relation_*_found' is triggered", () => {
        const cb = jest.fn();
        expect(
            conversation.onEntityRelationFound(
                EntitiesRelationEvent.CreditCard,
                cb,
            ),
        ).toBeInstanceOf(Conversation);
        conversation.publish("relation_credit_card_found");
        expect(cb).toHaveBeenCalledTimes(1);
    });

    it("should execute callback if event 'relation_*_found' is triggered while subscribing to wildcard", () => {
        const cb = jest.fn();
        expect(conversation.onEntityRelationFound("*", cb)).toBeInstanceOf(
            Conversation,
        );
        conversation.publish("relation_credit_card_found");
        expect(cb).toHaveBeenCalledTimes(1);
    });

    it("should execute callback if event 'error' is triggered", () => {
        const cb = jest.fn();
        expect(conversation.onError(cb)).toBeInstanceOf(Conversation);
        conversation.publish("error");
        expect(cb).toHaveBeenCalledTimes(1);
    });

    it("should execute callback if event 'segment_decoded' is triggered", () => {
        const cb = jest.fn();
        expect(conversation.onSegmentDecoded(cb)).toBeInstanceOf(Conversation);
        conversation.publish("segment_decoded", { speaker: "me" });
        expect(cb).toHaveBeenCalledTimes(1);
    });

    it("should execute callback if event 'speaker_joined' is triggered", () => {
        const cb = jest.fn();
        expect(conversation.onSpeakerJoined(cb)).toBeInstanceOf(Conversation);
        conversation.publish(`speaker_joined`);
        expect(cb).toHaveBeenCalledTimes(1);
    });

    it("should execute callback if event 'speaker_left' is triggered", () => {
        const cb = jest.fn();
        expect(conversation.onSpeakerLeft(cb)).toBeInstanceOf(Conversation);
        conversation.publish(`speaker_left`);
        expect(cb).toHaveBeenCalledTimes(1);
    });

    it("should execute callback if event 'words_decoded' is triggered", () => {
        const cb = jest.fn();
        expect(conversation.onWordsDecoded(cb)).toBeInstanceOf(Conversation);
        conversation.publish(`words_decoded`, { speaker: "me" });
        expect(cb).toHaveBeenCalledTimes(1);
    });

    it("should execute callback if event 'tags_found' is triggered", () => {
        const cb = jest.fn();
        expect(conversation.onTagsFound(cb)).toBeInstanceOf(Conversation);
        conversation.publish(`tags_found`, { speaker: "me" });
        expect(cb).toHaveBeenCalledTimes(1);
    });

    it("should execute callback if event 'segment_normalized' is triggered", () => {
        const cb = jest.fn();
        expect(conversation.onSegmentNormalized(cb)).toBeInstanceOf(Conversation);
        conversation.publish(`segment_normalized`, { speaker: "me" });
        expect(cb).toHaveBeenCalledTimes(1);
    });
});
