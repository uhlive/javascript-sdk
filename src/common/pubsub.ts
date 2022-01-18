export default class Pubsub {
    private events: Map<string, Array<Function>> = new Map();

    public publish(eventName: string, ...args: unknown[]) {
        if (this.events.has(eventName)) {
            this.events.get(eventName)?.forEach((cb) => {
                if (eventName.startsWith("entity_")) {
                    cb(...args, eventName);
                } else {
                    cb(...args);
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
