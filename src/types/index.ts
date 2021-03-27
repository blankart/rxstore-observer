import { OperatorFunction } from 'rxjs'

export interface RxJsStore<
    S = Record<string, any>,
    V extends Action = Action,
    U = SubscribeFunction<S>,
    W = WatchFunction<V>
> {
    getState: () => S
    subscribe: ( subscribeFunction: U ) => any
    dispatch: ( action: V ) => any
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

export interface RxjsStoreOperator<
    T,
    V extends ( args: Record<string, any> ) => any = ( args: Record<string, any> ) => any
> {
    key: T
    callback: V
}

export interface RxjsStoreMiddleware<
    S extends Record<string, any> = Record<string, any>,
    T extends Action = Action
> {
    ( store: RxJsStore<S, T> ) : ( next: ( a: T ) => any ) => ( action: T ) => any
}
