export interface IEventEmitter extends IObservable {
    emit(payload: any);
}

export interface IObservable {
    subscribe(callback: Function);
}

export class EventEmitter {

    _subscribers: Subscriber[] = [];
    _token = 0;

    constructor(public name: string) {
    }

    subscribe (callback) {
        let subscriber = new Subscriber(this._token, callback);
        this._subscribers.push(subscriber);
        return this._token++;
    }

    unsubscribe (subscriberToken: number) {
        let i, sub;
        for (i = 0; i < this._subscribers.length; i++) {
            sub = this._subscribers[i];
            if (sub && sub.token === subscriberToken) {
                this._subscribers.splice(i, 1);
                return;
            }
        }
    }

    emit (payload) {
        this._subscribers.forEach(sub => {
            if (sub && sub.callback) {
                sub.callback(payload);
            }
        });
    }
}

export class Subscriber {

    constructor(public token: number, public callback: Function) {
    }
}
