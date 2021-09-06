import { BehaviorSubject, ReplaySubject, Subject, from, merge } from 'rxjs'
import { 
    RxStore, 
    EffectFunction, 
    SubscribeFunction, 
    RxReducer,  
    RxStoreEnhancer,
    AnyAction,
} from '../types'
import { mergeMap } from 'rxjs/operators'

/**
 * Function for creating an RxJS Store.
 * 
 * @param {RxReducer<S, T>} rootReducer 
 * @param {S} initialState
 * 
 * @return {RxStore<S, T, SubscribeFunction, EffectFunction>} generated store
 */
const createRxStore = <
    S extends Record<string, any>,
    T extends AnyAction,
    U extends Array<EffectFunction<S, T>>
>(
    rootReducer: RxReducer<S, T>,
    initialState?: S,
    effects?: U,
    enhancer?: RxStoreEnhancer<S, T>,
): RxStore<S, T> => {
    if ( typeof rootReducer !== 'function' ) {
        throw new Error( `Invalid reducer parameter. Reducer must be of type \`function\`. But found: \`${ rootReducer }\`` )
    }

    if ( enhancer && ( typeof enhancer !== 'function' ) ) {
        throw new Error( 'Invalid enhancer function. Enhancer must be of type `function`' )
    }

    /**
     * Allow enhancers to overwrite the existing creator function.
     */
    if ( enhancer ) {
        return enhancer( createRxStore )( rootReducer, initialState, effects ) as RxStore<S, T>
    }

    /**
     * If no initial state is passed, it is already
     * assumed that the initial state is passed as
     * the default value of the reducer.
     */
    if ( ! initialState ) {
        initialState = rootReducer( ( undefined as unknown ) as S, { type: '@@RXSTORE/INIT' } as unknown as T )
    }

    /**
     * State handlers. This allows us to store all global states
     * into a single entity. Ideally, global state is of type object.
     * 
     * BehaviorSubject is used to subscribe to state changes. 
     */
    const state$ = new BehaviorSubject<S>( initialState as S )
    const getState = () => state$.getValue()

    /**
     * Actions are objects which has a type and a payload.
     * This is passed inside the dispatch function that
     * changes the values inside the store.
     * 
     * BehaviorSubject is used to subscribe to action streams.
     * After every changes, the action is passed as the second argument
     * in the reducer function to change the current state.
     */
    const action$ = new Subject<T>()
    action$.subscribe( { next: newAction => state$.next( rootReducer( getState(), newAction as T ) ) } )

    const subscribe = ( subscribeFunction: SubscribeFunction<T> ): () => void => {
        const subscription = action$.subscribe( { next: newAction => subscribeFunction( newAction as T ) } )
        return () => subscription.unsubscribe() 
    }

    const dispatch = ( action: T ) => {
        action$.next( action )
        return action
    }

    const _effect$ = new ReplaySubject<EffectFunction<S, T>>( 1 )
    const effects$ = _effect$.pipe( mergeMap( effect => effect( from( action$ ), from( state$ ) ) )  )
    const storeConfig = { getState, subscribe, dispatch }

    /**
     * Side effects handler.
     * Actions from the observable streams will be
     * passed to the original action$ stream.
     */
    effects$.subscribe(
        next => storeConfig.dispatch( next )
    )

    if ( effects ) {
        _effect$.next( action$ => merge( ...effects.map( e$ => e$( action$, state$ ) ) ) )
    }

    return storeConfig
}

export default createRxStore