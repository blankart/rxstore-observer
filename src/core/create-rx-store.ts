import { BehaviorSubject, merge, ReplaySubject, Subject } from 'rxjs'
import { 
    RxStore, 
    ObserverFunction, 
    SubscribeFunction, 
    Action, 
    RxReducer,  
    RxStoreEnhancer,
    RxObserverOrObserverClass,
} from '../types'
import { mergeMap } from 'rxjs/operators'

/**
 * Function for creating an RxJS Store.
 * 
 * @param {RxReducer<S, T>} rootReducer 
 * @param {S} initialState
 * 
 * @return {RxStore<S, T, SubscribeFunction, ObserverFunction>} generated store
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
        throw new Error( 'Invalid reducer parameter. Reducer must be of type `function`.' )
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
        initialState = rootReducer( ( undefined as unknown ) as S, {} as T )
    }

    /**
     * State handlers. This allows us to store all global states
     * into a single entity. Ideally, global state is of type object.
     * 
     * BehaviorSubject is used to subscribe to state changes. 
     */
    const state$ = new BehaviorSubject<S>( initialState as S )
    const getState = () => state$.getValue() as S

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
        next: newAction => {
            const newState = rootReducer( getState(), newAction as T )
            state$.next( newState )
        }
    } )

    const subscribe = ( subscribeFunction: SubscribeFunction<T> ): () => void => {
        const subscription = action$.subscribe( { next: newAction => subscribeFunction( newAction as T ) } )
        return () => {
            subscription.unsubscribe()
        }
    }

    const _observer$ = new ReplaySubject<ObserverFunction<S, T>>( 1 )
    const _observers$ = new BehaviorSubject<Array<ObserverFunction<S, T>>>( [] )

    /**
     * Observers factory derived from merging
     * all observers from `addObserver` and `addObservers`
     */
    const observers$ = _observer$.pipe(
        mergeMap( observer => merge( observer( action$, state$ ), ..._observers$.value.map( o => o( action$, state$ ) ) ) )
    )

    /**
     * Side effects handler.
     * Actions from the observable streams will be
     * passed to the original action$ stream.
     */
    observers$.subscribe(
        next => action$.next( next )
    )

    const addObserver = <
        U extends Action, 
        V extends Action = Extract<T, U>
    >( observerFunction: ObserverFunction<S, T, V> ) => { 
        if ( typeof observerFunction === 'function' ) {
            _observer$.next( observerFunction as unknown as ObserverFunction<S, T> )
            return
        }
        throw new Error( `Invalid observer passed. Expected an observer function instance. But received: ${ observerFunction }` )
    }

    const addObservers = ( newObservers: Array<RxObserverOrObserverClass<S,T>> ) => {
        newObservers.forEach( ( observer: RxObserverOrObserverClass<S, T> ) => {
            if ( typeof observer === 'function' ) {
                _observer$.next( observer )
                return
            }

            throw new Error( `Invalid observer passed. Expected an observer function instance. But received: ${ observer }` )
        } )
    }

    const dispatch = ( newAction: T ) => {
        action$.next( newAction )
    }

    return { getState, subscribe, dispatch, addObserver, addObservers }
}

export default createRxStore
