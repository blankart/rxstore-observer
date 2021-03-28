import { OperatorFunction } from 'rxjs'

export interface RxJsStore<
    S = Record<string, any>,
    V extends Action = Action,
    U = SubscribeFunction<S>,
    W = WatchFunction<V>
> {
    /**
     * Gets the current state value.
     * @return {S} current state value
     */
    getState: () => S
    /**
     * Subscribe function listens to every state changes
     * inside the store. It returns a function which can be called
     * again to unsubscribe to the changes. 
     * 
     * @param {SubscribeFunction<StoreState>} subscribeFunction 
     * 
     * @return {() => void} unsubscribe function
     */
    subscribe: ( subscribeFunction: U ) => any
    /**
     * Dispatch function accepts an action object which will be
     * dispatched to the reducer.
     * 
     * @param {T} action object
     */
    dispatch: <T = V>( action: T ) => any
    /**
     * Watchers are the sagas of Rxjs Store. It subscribes to a single action type
     * to do side-effects using pipe and Rxjs operators.
     * ```
     * import { mapTo } from 'rxjs/operators'
     * store.addWatcher( 'DO_SOMETHING', pipe => pipe( mapTo({ type: 'THEN_DO_THIS' }) ) );
     * ```
     * @param {V["type"]} type action type to subscribe to.
     * @param {W} watchFunction callback function.
     */
    addWatcher: ( type: V[ "type" ], watchFunction: W ) => any
}

export interface WatchFunction<T = any> {
    ( _pipe: ( ...args: Array<OperatorFunction<T, any> | RxjsStoreOperator<any, any>> ) => Array<OperatorFunction<T, any> | RxjsStoreOperator<any, any>> ): void
} 

export interface SubscribeFunction<T = Record<string, any>> { 
    ( store: T ): any 
}

export interface Action<T = any> {
    type: T,
    [key: string]: any
}

export type ActionType<T extends Action> = T["type"]

export interface RxjsStoreOperator<
    T,
    V extends ( args: { store: Record<string, any>, action: Action  } ) => any 
    = ( args: { store: Record<string, any>, action: Action  } ) => any
> {
    key: T
    callback: V
}

export interface RxjsStoreMiddleware<
    S = Record<string, any>,
    T extends Action = Action,
    U = Action
> {
    ( store: RxJsStore<S, T> ) : ( next: ( a: T ) => any ) => ( a: U ) => any
}

export interface RxjsReducer<T, U> { ( state: T, action: U ): T }

export interface WatchListener<T extends string, U extends ( ...args: any ) => any> {
    type: T,
    watchFunction: U
}

export interface SubscriptionListener<T extends Record<string, any>> {
    key: number,
    subscribeFunction: SubscribeFunction<T>
}
