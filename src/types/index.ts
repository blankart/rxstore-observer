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
     * @param {SubscribeFunction<V>} subscribeFunction 
     * 
     * @return {() => void} unsubscribe function
     */
    subscribe: ( subscribeFunction: SubscribeFunction<V> ) => any
    /**
     * Dispatch function accepts an action object which will be
     * dispatched to the reducer.
     * 
     * @param {T} action object
     */
    dispatch: ( action: V ) => any
    /**
     * Observers are the sagas of Rxjs Store. It subscribes to a single action type
     * to do side-effects using pipe and Rxjs operators.
     * ```
     * import { mapTo } from 'rxjs/operators'
     * store.addObserver( 'DO_SOMETHING', pipe => pipe( mapTo({ type: 'THEN_DO_THIS' }) ) );
     * ```
     * @param {ActionType<V>} type action type to subscribe to.
     * @param {W} observerFunction callback function.
     */
    addObserver: ( type: ActionType<V>, observerFunction: ObserverFunction<V> ) => any
    /**
     * Used to include all observers at once instead of calling 
     * `addObserver` repeatedly. Added observers must be of type `RxObserver<Action>`.
     * ```
     * import { createObserver } from 'rxstore-watch'
     * const doSomethingObserver = createObserver( 'DO_SOMETHING', pipe => pipe( mapTo({ type: 'THEN_DO_THIS' })));
     * const doStuffObserver = createObserver( 'DO_STUFF', pipe => pipe( mapTo({ type: 'THEN_DO_THAT' })));
     * 
     * store.addObservers([
     * doSomethingObserver,
     * doStuffObserver
     * ])
     * ```
     */
    addObservers: ( newObservers: Array<RxObserver<V>> ) => any
}

export interface ObserverFunction<T = any> {
    ( pipe: ( ...args: Array<OperatorFunction<T, any> | RxStoreOperator<any, any>> ) => Array<OperatorFunction<T, any> | RxStoreOperator<any, any>> ): void
} 

export interface SubscribeFunction<T extends Action> { 
    ( action: T ): any 
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

export interface ObserveListener<
    T extends string, 
    U extends ( ...args: any ) => any
> {
    type: T,
    observerFunction: U
}

export interface RxObserver<T extends Action> {
    ( 
        a: Array<ObserveListener<ActionType<T>, ObserverFunction<T>>>,
        b: BehaviorSubject<Array<ObserveListener<ActionType<T>, ObserverFunction<T>>>>
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
    S extends Record<string, any>, 
    A extends Action 
> = {
  [ K in keyof S ]: RxReducer<S[ K ], A>
}

/**
 * @see https://github.com/reduxjs/redux
 */
export type StateFromReducersMapObject<M> = M extends RxReducersMapObject<Record<string, any>, Action>
  ? { [ P in keyof M ]: M[ P ] extends RxReducer<infer S, any> ? S : never }
  : never
