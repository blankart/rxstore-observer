import { Observable } from 'rxjs'

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
     * Effects are the sagas of Rxjs Store. It subscribes to a single action type
     * to do side-effects using pipe and Rxjs operators.
     * ```
     * import { mapTo } from 'rxjs/operators'
     * import { ofType } from 'rxstore-observer'
     * store.addEffect( action$ => action$.pipe( ofType('DO_SOMETHING'), mapTo({ type: 'THEN_DO_THIS' }) ) );
     * ```
     * @param {W} effectFunction callback function.
     * 
     */
    addEffect: <V extends Action>( effectFunction: EffectFunction<S, T, V> ) => void
    /**
     * Used to include all effects at once instead of calling 
     * `addEffect` repeatedly. Added effects must be of type `RxEffect<Action>`.
     * ```
     * import { ofType } from 'rxstore-observer'
     * const doSomethingEffect = action$ => action$.pipe( ofType('DO_SOMETHING'), mapTo({ type: 'THEN_DO_THIS' }));
     * const doStuffEffect = action$ => action$.pipe( ofType('DO_STUFF'), mapTo({ type: 'THEN_DO_THAT' }));
     * 
     * store.addEffects([
     * doSomethingEffect,
     * doStuffEffect
     * ])
     * ```
     */
    addEffects: ( newEffects: Array<RxEffectOrEffectClass<S, T>> ) => any
}

export interface EffectFunction<
    S extends Record<string, any>,
    T extends Action,
    V extends Action = T,
> {
    ( action$: Observable<T>, state$: Observable<S> ): Observable<V>
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

export type RxEffectOrEffectClass<
    S extends Record<string, any>,
    T extends Action,
    U extends Action = T,
> = EffectFunction<S, T, U>  | any

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