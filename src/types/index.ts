import { Observable } from 'rxjs'

export interface RxStoreCreator<
    S extends Record<string, any>,
    T extends AnyAction,
> {
    (r: RxReducer<S, T>, s: S | undefined, f?: Array<EffectFunction<S, T>>, e?: RxStoreEnhancer<S, T> ): RxStore<S, T>
}

export interface RxStoreEnhancer<
    S extends Record<string, any>,
    T extends AnyAction,
> {
    (c: RxStoreCreator<S, T> ): RxStoreCreator<S, T>
}

export interface RxStore<
    S extends Record<string, any>,
    T extends AnyAction,
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
}

export interface EffectFunction<
    S extends Record<string, any>,
    T extends AnyAction,
    V extends AnyAction = T,
> {
    ( action$: Observable<T>, state$: Observable<S> ): Observable<V>
} 

export interface SubscribeFunction<T extends Action> { 
    ( action: T ): any 
}

export interface Action<T = any>  {
    type: T
}

export interface AnyAction<P = any> extends Action {
    [k: string]: P
}

export interface ActionWithPayload<T = any, P = any> extends AnyAction  {
    type: T,
    payload: P
}

export interface RxStoreMiddleware<
    S extends Record<string, any> = Record<string, any>,
    T extends AnyAction = AnyAction,
> {
    ( store: RxStore<S, T> ) : ( next: ( a: T ) => any ) => ( a: any ) => any
}

export type RxReducer<T, U> = ( state: T | undefined, action: U ) => T

export interface RxDispatch<
    S extends AnyAction
> {
    ( a: S ): any
}

/**
 * @see https://github.com/reduxjs/redux
 */
export type RxReducersMapObject<
    S extends Record<string, any>, 
    A extends AnyAction 
> = {
  [ K in keyof S ]: RxReducer<S[ K ], A>
}

/**
 * @see https://github.com/reduxjs/redux
 */
export type StateFromReducersMapObject<M> = M extends RxReducersMapObject<Record<string, any>, AnyAction>
  ? { [ P in keyof M ]: M[ P ] extends RxReducer<infer S, any> ? S : never }
  : never

export type RxModelMappedActions<
    A extends Record<string, ( ...args: any[] ) => void>
> = { [ K in keyof A ]: ActionWithPayload<K, Parameters<A[K]>> }

export type RxModelObservableActions<A extends Record<string, ( ...args: any[] ) => void>> = RxModelMappedActions<A>[ keyof A ]

export type RxModelActionOf<A extends Record<string, ( ...args: any[] ) => void>, S extends keyof A> = RxModelMappedActions<A>[S]