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
        expect(uhlive.conversations.size).toEqual(1);

        // @ts-ignore
        // eslint-disable-next-line import/namespace
        expect(Phoenix.mockPhoenixChannelJoin).toHaveBeenCalledTimes(1);
    });

    it("should return the same conversation if already joined", () => {
        const uhlive = new Uhlive("my-identifier", "my-token");
        uhlive.connect();
        const conversation1 = uhlive.join("test", { readonly: true });
        const conversation2 = uhlive.join("test", { readonly: true });
        expect(console.warn).toHaveBeenCalled();
        expect(conversation1).toBeInstanceOf(Conversation);
        expect(conversation1).toStrictEqual(conversation2);
        expect(uhlive.conversations.size).toEqual(1);

        // @ts-ignore
        // eslint-disable-next-line import/namespace
        expect(Phoenix.mockPhoenixChannelJoin).toHaveBeenCalledTimes(1);
    });

    it("should be able to leave a conversation", async () => {
        const uhlive = new Uhlive("my-identifier", "my-token");
        uhlive.connect();
        uhlive.join("test", { readonly: true });
        uhlive.leave("test");

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

    it("should return false if the conversation doesn't exist", async () => {
        const uhlive = new Uhlive("my-identifier", "my-token");
        uhlive.connect();
        uhlive.join("test", { readonly: true });
        await expect(uhlive.leave("test2")).rejects.toEqual(
            'Unknown conversationId "test2".',
        );
    });

    it("should be able to leave all conversations", () => {
        const uhlive = new Uhlive("my-identifier", "my-token");
        uhlive.connect();
        uhlive.join("test1", { readonly: true });
        uhlive.join("test2", { readonly: true });
        uhlive.leaveAllConversations();

        // @ts-ignore
        // eslint-disable-next-line import/namespace
        expect(Phoenix.mockPhoenixSocketConnect).toHaveBeenCalledTimes(1);

        // @ts-ignore
        // eslint-disable-next-line import/namespace
        expect(Phoenix.mockPhoenixChannelJoin).toHaveBeenCalledTimes(2);

        // @ts-ignore
        // eslint-disable-next-line import/namespace
        expect(Phoenix.mockPhoenixChannelLeave).toHaveBeenCalledTimes(2);
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
