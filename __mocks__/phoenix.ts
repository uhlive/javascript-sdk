export const mockPhoenixSocketConnect = jest.fn();
export const mockPhoenixSocketDisconnect = jest.fn().mockImplementation((cb) => {
    cb();
});
export const mockPhoenixChannelReceive = jest.fn();
export const mockPhoenixChannelJoin = jest.fn().mockImplementation(() => {
    return {
        receive: mockPhoenixChannelReceive,
    };
});
export const mockPhoenixChannelLeave = jest.fn();
export const mockPhoenixChannelOn = jest.fn();
export const mockPhoenixChannelOnClose = jest.fn();
export const mockPhoenixChannelOnError = jest.fn();
export const mockPhoenixSocketChannel = jest.fn().mockImplementation(() => {
    return {
        join: mockPhoenixChannelJoin,
        leave: mockPhoenixChannelLeave,
        on: mockPhoenixChannelOn,
        onClose: mockPhoenixChannelOnClose,
        onError: mockPhoenixChannelOnError,
    };
});
export const mockPhoenixSocketOnClose = jest.fn();
export const mockPhoenixSocketOnError = jest.fn();
export const mockPhoenixSocketOnMessage = jest.fn();

export const Socket = jest.fn().mockImplementation(() => {
    return {
        channel: mockPhoenixSocketChannel,
        connect: mockPhoenixSocketConnect,
        disconnect: mockPhoenixSocketDisconnect,
        onClose: mockPhoenixSocketOnClose,
        onError: mockPhoenixSocketOnError,
        onMessage: mockPhoenixSocketOnMessage,
    };
});
