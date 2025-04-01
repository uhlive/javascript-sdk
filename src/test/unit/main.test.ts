/**
 * @jest-environment jsdom
 */
import * as Phoenix from "phoenix";
import { Conversation } from "../../conversation";
import { Uhlive } from "../../main";

console.warn = jest.fn();
console.error = jest.fn();

describe("Uhlive", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should be able to create a new instance", () => {
        const uhlive = new Uhlive("my-identifier", "my-token");
        expect(uhlive).toBeTruthy();
    });

    it("should create a new phoenix.Socket instance", () => {
        new Uhlive("my-identifier", "my-token");
        expect(Phoenix.Socket).toHaveBeenCalledTimes(1);
    });

    it("should be able to connect to Phoenix", () => {
        const uhlive = new Uhlive("my-identifier", "my-token");
        uhlive.connect();

        // @ts-ignore
        // eslint-disable-next-line import/namespace
        expect(Phoenix.mockPhoenixSocketConnect).toHaveBeenCalledTimes(1);
    });

    it("should be able to disconnect from Phoenix", async () => {
        const uhlive = new Uhlive("my-identifier", "my-token");
        uhlive.connect();
        const disconnect = await uhlive.disconnect();

        // @ts-ignore
        // eslint-disable-next-line import/namespace
        expect(Phoenix.mockPhoenixSocketDisconnect).toHaveBeenCalledTimes(1);

        expect(disconnect).toEqual(undefined);
    });

    it("should be able to join a conversation", () => {
        const uhlive = new Uhlive("my-identifier", "my-token");
        uhlive.connect();
        const conversation = uhlive.join("test", { readonly: true });
        expect(conversation).toBeInstanceOf(Conversation);
        expect(uhlive.getConversation).not.toBeNull();

        // @ts-ignore
        // eslint-disable-next-line import/namespace
        expect(Phoenix.mockPhoenixChannelJoin).toHaveBeenCalledTimes(1);
    });

    it("should throw if already joined a conversation", () => {
        const uhlive = new Uhlive("my-identifier", "my-token");
        uhlive.connect();
        const conversation1 = uhlive.join("test", { readonly: true });
        expect(conversation1).toBeInstanceOf(Conversation);
        expect(() => uhlive.join("test2", { readonly: true })).toThrow(
            "You can join only one conversation per WebSocket connection. Please open a new connection to join another conversation.",
        );

        // @ts-ignore
        // eslint-disable-next-line import/namespace
        expect(Phoenix.mockPhoenixChannelJoin).toHaveBeenCalledTimes(1);
    });

    it("should be able to leave a conversation", async () => {
        const uhlive = new Uhlive("my-identifier", "my-token");
        uhlive.connect();
        uhlive.join("test", { readonly: true });
        uhlive.leave();

        // @ts-ignore
        // eslint-disable-next-line import/namespace
        expect(Phoenix.mockPhoenixSocketConnect).toHaveBeenCalledTimes(1);

        // @ts-ignore
        // eslint-disable-next-line import/namespace
        expect(Phoenix.mockPhoenixChannelJoin).toHaveBeenCalledTimes(1);

        // @ts-ignore
        // eslint-disable-next-line import/namespace
        expect(Phoenix.mockPhoenixChannelLeave).toHaveBeenCalledTimes(1);
        // expect(uhlive.getConversation).toBeNull();
    });

    it("should return false if the conversation doesn't exist", async () => {
        const uhlive = new Uhlive("my-identifier", "my-token");
        uhlive.connect();
        await expect(uhlive.leave()).rejects.toEqual(
            "You must join a conversation before leaving it.",
        );
    });

    it("should be able to leave all conversations", () => {
        const uhlive = new Uhlive("my-identifier", "my-token");
        uhlive.connect();
        uhlive.join("test1", { readonly: true });
        expect(() => uhlive.join("test2", { readonly: true })).toThrow(
            "You can join only one conversation per WebSocket connection. Please open a new connection to join another conversation.",
        );
        uhlive.leaveAllConversations();

        expect(console.warn).toHaveBeenCalled();

        // @ts-ignore
        // eslint-disable-next-line import/namespace
        expect(Phoenix.mockPhoenixSocketConnect).toHaveBeenCalledTimes(1);

        // @ts-ignore
        // eslint-disable-next-line import/namespace
        expect(Phoenix.mockPhoenixChannelJoin).toHaveBeenCalledTimes(1);

        // @ts-ignore
        // eslint-disable-next-line import/namespace
        expect(Phoenix.mockPhoenixChannelLeave).toHaveBeenCalledTimes(1);
    });

    it("should start recording the conversation when joined", () => {
        const handleSpy = jest.spyOn(
            Conversation.prototype as any,
            "startRecording",
        );
        handleSpy.mockImplementation(() => {
            return new Promise((resolve) => {
                resolve({
                    message: "whatever",
                    status: "success",
                });
            });
        });

        const uhlive = new Uhlive("my-identifier", "my-token");
        uhlive.connect();
        uhlive.join("test");
        expect(console.error).not.toHaveBeenCalled();

        expect(handleSpy).toHaveBeenCalledTimes(1);
    });

    it("should not start recording the conversation when joined in read-only", () => {
        const handleSpy = jest.spyOn(
            Conversation.prototype as any,
            "startRecording",
        );
        handleSpy.mockImplementation(() => {
            return new Promise((resolve) => {
                resolve({
                    message: "whatever",
                    status: "success",
                });
            });
        });

        const uhlive = new Uhlive("my-identifier", "my-token");
        uhlive.connect();
        uhlive.join("test", { readonly: true });
        expect(console.error).not.toHaveBeenCalled();

        expect(handleSpy).toHaveBeenCalledTimes(0);
    });
});
