export default class Pubsub {
    private events: Map<string, Array<Function>> = new Map();

    public publish(eventName: string, data?: any, context?: any) {
        if (this.events.has(eventName)) {
            this.events.get(eventName)?.forEach((cb) => {
                if (data && context) {
                    cb(data, context);
                } else if (data) {
                    cb(data);
                } else {
                    cb();
                }
            });
        }
    }

    public subscribe<T>(eventName: string, callback: (...args: any) => T): any {
        if (this.events.has(eventName)) {
            this.events.get(eventName)!.push(callback);
        } else {
            this.events.set(eventName, [callback]);
        }

        return this;
    }
}
