import { Observable, OperatorFunction } from 'rxjs'

export interface RxJsStore<
    StoreState extends Record<string, any>,
    SubscribeFunction extends ( store: StoreState ) => any,
    ActionType extends string,
    Action extends { type: ActionType, [key: string]: any },
    WatchFunction = ( _pipe: ( ...args: Array<OperatorFunction<unknown, unknown>> ) => Observable<Action> ) => Observable<Action>
> {
    getState: () => StoreState
    subscribe: ( subscribeFunction: SubscribeFunction ) => any
    dispatch: ( action: Action ) => any
    addWatcher: ( type: ActionType, watchFunction: WatchFunction ) => any
}