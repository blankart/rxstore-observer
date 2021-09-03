import { BehaviorSubject, merge, ReplaySubject, Subject, from } from 'rxjs'
import { 
    RxStore, 
    EffectFunction, 
    SubscribeFunction, 
    Action, 
    RxReducer,  
    RxStoreEnhancer,
    RxEffectOrEffectClass,
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
    T extends Action,
>(
    rootReducer: RxReducer<S, T>,
    initialState?: S,
    enhancer?: RxStoreEnhancer<S, T>
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
        return enhancer( createRxStore )( rootReducer, initialState ) as RxStore<S, T>
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
    action$.subscribe( {
        next: newAction => state$.next( rootReducer( getState(), newAction as T ) )
    } )

    const subscribe = ( subscribeFunction: SubscribeFunction<T> ): () => void => {
        const subscription = action$.subscribe( { next: newAction => subscribeFunction( newAction as T ) } )
        return () => subscription.unsubscribe() 
    }

    const _effect$ = new ReplaySubject<EffectFunction<S, T>>( 1 )
    const _effects$ = new BehaviorSubject<Array<EffectFunction<S, T>>>( [] )

    /**
     * Effects factory derived from merging
     * all effects from `addEffect` and `addEffects`
     */
    const effects$ = _effect$.pipe(
        mergeMap( effect => merge( effect( from( action$ ), from( state$ ) ), ..._effects$.value.map( o => o( from( action$ ), from( state$ ) ) ) ) )
    )

    /**
     * Side effects handler.
     * Actions from the observable streams will be
     * passed to the original action$ stream.
     */
    effects$.subscribe(
        next => action$.next( next )
    )

    const addEffect = <
        U extends Action, 
        V extends Action = Extract<T, U>
    >( effectFunction: EffectFunction<S, T, V> ) => { 
        if ( typeof effectFunction === 'function' ) {
            _effect$.next( effectFunction as unknown as EffectFunction<S, T> )
            return
        }
        throw new Error( `Invalid effect passed. Expected an effect function instance. But received: ${ effectFunction }` )
    }

    const addEffects = ( newEffects: Array<RxEffectOrEffectClass<S,T>> ) => {
        newEffects.forEach( ( effect: RxEffectOrEffectClass<S, T> ) => {
            if ( typeof effect === 'function' ) {
                _effect$.next( effect )
                return
            }

            throw new Error( `Invalid effect passed. Expected an effect function instance. But received: ${ effect }` )
        } )
    }

    const dispatch = ( newAction: T ) => action$.next( newAction )

    return { getState, subscribe, dispatch, addEffect, addEffects }
}

export default createRxStore
