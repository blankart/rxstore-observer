import { BehaviorSubject, Observable, Subject } from 'rxjs'

export interface RxStoreCreator<
    S extends Record<string, any>,
    T extends Action,
> {
    (r: RxReducer<S, T>, s: S | undefined, e?: RxStoreEnhancer<S, T> ): RxStore<S, T>
}

export interface RxStoreEnhancer<
    S extends Record<string, any>,
    T extends Action,
> {
    (c: RxStoreCreator<S, T> ): RxStoreCreator<S, T>
}

export interface RxStore<
    S extends Record<string, any>,
    T extends Action,
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
    subscribe: ( subscribeFunction: SubscribeFunction<T> ) => any
    /**
     * Dispatch function accepts an action object which will be
     * dispatched to the reducer.
     * 
     * @param {T} action object
     */
    dispatch: ( action: T ) => any
    /**
     * Observers are the sagas of Rxjs Store. It subscribes to a single action type
     * to do side-effects using pipe and Rxjs operators.
     * ```
     * import { mapTo } from 'rxjs/operators'
     * import { ofType } from 'rxstore-observer'
     * store.addObserver( action$ => action$.pipe( ofType('DO_SOMETHING'), mapTo({ type: 'THEN_DO_THIS' }) ) );
     * ```
     * @param {W} observerFunction callback function.
     * 
     */
    addObserver: <V extends Action>( observerFunction: ObserverFunction<S, T, V> ) => void
    /**
     * Used to include all observers at once instead of calling 
     * `addObserver` repeatedly. Added observers must be of type `RxObserver<Action>`.
     * ```
     * import { ofType } from 'rxstore-observer'
     * const doSomethingObserver = action$ => action$.pipe( ofType('DO_SOMETHING'), mapTo({ type: 'THEN_DO_THIS' }));
     * const doStuffObserver = action$ => action$.pipe( ofType('DO_STUFF'), mapTo({ type: 'THEN_DO_THAT' }));
     * 
     * store.addObservers([
     * doSomethingObserver,
     * doStuffObserver
     * ])
     * ```
     */
    addObservers: ( newObservers: Array<RxObserverOrObserverClass<S, T>> ) => any
}

export interface ObserverFunction<
    S extends Record<string, any>,
    T extends Action,
    V extends Action = T,
> {
    ( action$: Subject<T>, state$: BehaviorSubject<S> ): Observable<V>
} 

export interface SubscribeFunction<T extends Action> { 
    ( action: T ): any 
}

export type Action<T = any> =  {
    [ key: string ]: T
}

export type ActionWithPayload<T = any, P = any> =  {
    type: T
    payload: P
}

export interface RxStoreMiddleware<
    S extends Record<string, any> = Record<string, any>,
    T extends Action = Action,
> {
    ( store: RxStore<S, T> ) : ( next: ( a: T ) => any ) => ( a: any ) => any
}

export type RxReducer<T, U> = ( state: T | undefined, action: U ) => T

export type RxObserverOrObserverClass<
    S extends Record<string, any>,
    T extends Action,
    U extends Action = T,
> = ObserverFunction<S, T, U>  | any

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

export type RxModelMappedActions<
    A extends Record<string, ( ...args: any[] ) => void>
> = { [ K in keyof A ]: ActionWithPayload<K, Parameters<A[K]>> }

export type RxModelObservableActions<A extends Record<string, ( ...args: any[] ) => void>> = RxModelMappedActions<A>[ keyof A ]

export type RxModelActionOf<A extends Record<string, ( ...args: any[] ) => void>, S extends keyof A> = RxModelMappedActions<A>[S]

export interface RxModelDecorated<
    S extends Record<string, any>,
    A extends Record<string, ( ...args: any ) => void>
> {
    initialState: S,
    actions: { [ K in keyof A ]: ( ...a: Parameters<A[K]> ) => ActionWithPayload<K, Parameters<A[K]>> }
    observers: Array<ObserverFunction<S, { [ K in keyof A ]: ActionWithPayload<K, Parameters<A[K]>> }[ keyof A ]>>
    reducer: RxReducer<S, { [ K in keyof A ]: ActionWithPayload<K, Parameters<A[K]>> }[ keyof A ]>
}

export interface PreprocessedRxModelPrototype<
    S extends Record<string, any>,
    A extends Record<string, ( ...args: any[] ) => void>
> {
    states: Array<keyof S>,
    reducersMap: { [ K in keyof A ]: { key: K, fn: ( s: S ) => S } }[ keyof A ][]
    actions: { [ K in keyof A ]: (s: string) => ( ...a: Parameters<A[K]> ) => ActionWithPayload<K, Parameters<A[K]>> }
    actionTypes: Array<A['type']>
    observers: Array<ObserverFunction<S, { [ K in keyof A ]: ActionWithPayload<K, Parameters<A[K]>> }[ keyof A ]>>
}