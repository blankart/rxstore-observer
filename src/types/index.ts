import { OperatorFunction, BehaviorSubject } from 'rxjs'

export interface RxStore<
    S extends Record<string, any>,
    V extends Action,
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
    subscribe: ( subscribeFunction: SubscribeFunction<S> ) => any
    /**
     * Dispatch function accepts an action object which will be
     * dispatched to the reducer.
     * 
     * @param {T} action object
     */
    dispatch: ( action: V ) => any
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
    addWatcher: ( type: V[ "type" ], watchFunction: WatchFunction<V> ) => any
    /**
     * Used to include all watchers at once instead of calling 
     * `addWatcher` repeatedly. Added watchers must be of type `RxWatcher<Action>`.
     * ```
     * import { createWatcher } from 'rxstore-watch'
     * const doSomethingWatcher = createWatcher( 'DO_SOMETHING', pipe => pipe( mapTo({ type: 'THEN_DO_THIS' })));
     * const doStuffWatcher = createWatcher( 'DO_STUFF', pipe => pipe( mapTo({ type: 'THEN_DO_THAT' })));
     * 
     * store.addWatchers([
     * doSomethingWatcher,
     * doStuffWatcher
     * ])
     * ```
     */
    addWatchers: (  newWatchers: Array<RxWatcher<V>> ) => any
}

export interface WatchFunction<T = any> {
    ( pipe: ( ...args: Array<OperatorFunction<T, any> | RxStoreOperator<any, any>> ) => Array<OperatorFunction<T, any> | RxStoreOperator<any, any>> ): void
} 

export interface SubscribeFunction<T = Record<string, any>> { 
    ( store: T ): any 
}

export type Action<T = any> =  {
    type: T,
    [key: string]: any
}

export type ActionType<T extends Action> = T["type"]

export interface RxStoreOperator<
    T,
    V = ( args: { store: Record<string, any>, action: Action, dispatch: ( a: Action ) => any  } ) => any 
> {
    key: T
    callback: V
}

export interface RxStoreMiddleware<
    S extends Record<string, any> = Record<string, any>,
    T extends Action = Action,
> {
    ( store: RxStore<S, T> ) : ( next: ( a: T ) => any ) => ( a: any ) => any
}

export type RxReducer<T, U> = ( state: T | undefined, action: U ) => T

export interface WatchListener<
    T extends string, 
    U extends ( ...args: any ) => any
> {
    type: T,
    watchFunction: U
}

export interface RxWatcher<T extends Action> {
    ( 
        a: Array<WatchListener<ActionType<T>, WatchFunction<T>>>,
        b: BehaviorSubject<Array<WatchListener<ActionType<T>, WatchFunction<T>>>>
    ): void
}

export interface RxDispatch<
    S extends Action
> {
    ( a: S ): any
}

/**
 * @see https://github.com/reduxjs/redux
 */
export type RxReducersMapObject<
    S = Record<string, any>, 
    A extends Action = Action
> = {
  [ K in keyof S ]: RxReducer<S[ K ], A>
}

/**
 * @see https://github.com/reduxjs/redux
 */
export type StateFromReducersMapObject<M> = M extends RxReducersMapObject
  ? { [ P in keyof M ]: M[ P ] extends RxReducer<infer S, any> ? S : never }
  : never
