import { BehaviorSubject, Observable, Subscription, OperatorFunction } from 'rxjs'
import { pipeFromArray } from 'rxjs/internal/util/pipe'
import { filter } from 'rxjs/operators'
import { 
    RxStore, 
    ObserverFunction , 
    SubscribeFunction , 
    Action, 
    RxStoreMiddleware, 
    RxReducer,  
    ObserveListener,
    ActionType,
    RxStoreOperator,
    RxObserver
} from '../types'
import { INIT, INITType } from '../constants/init'
import createObserversFactory from './create-observer-factory'
import createObserver from './create-observer'

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
    appliedMiddleware?: RxStoreMiddleware<S, T>
): RxStore<S, T> => {
    if ( typeof rootReducer !== 'function' ) {
        throw new Error( 'Invalid reducer parameter. Reducer must be of type `function`.' )
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
    const state = new BehaviorSubject<S>( initialState as S )
    const getState = () => state.getValue() as S

    /**
     * Actions are objects which has a type and a payload.
     * This is passed inside the dispatch function that
     * changes the values inside the store.
     * 
     * BehaviorSubject is used to subscribe to action streams.
     * After every changes, the action is passed as the second argument
     * in the reducer function to change the current state.
     */
    const action = new BehaviorSubject<T | { type: INITType }>( { type: INIT } )
    action.subscribe( {
        next: newAction => {
            const newState = rootReducer( getState(), newAction as T )
            state.next( newState )
        }
    } )

    const observers: Array<ObserveListener<ActionType<T>, ObserverFunction<T>>> = []
    const observersListener = new BehaviorSubject<Array<ObserveListener<ActionType<T>, ObserverFunction<T>>>>( [] )
    let observersSubscriptions: Array<Subscription> = []
    observersListener.subscribe( {
        next: newObservers => {
            observersSubscriptions.forEach( subscription => subscription.unsubscribe() )
            observersSubscriptions = []
            newObservers.forEach( newObserver => {
                const pipes = createObserversFactory<S, T>( state, dispatch, newObserver )
                const observable = ( pipeFromArray( [ 
                    filter( ( pipedAction: T ) => pipedAction.type === newObserver.type ),
                    ...pipes as Array<OperatorFunction<T, unknown | RxStoreOperator<any, any>>>
                ] )( action as Observable<T> ) ) as Observable<T>
                
                const subscription = observable.subscribe( {
                    next: newAction => {
                        /**
                         * If provided next action is null or undefined,
                         * don't dispatch anything.
                         */
                        if ( newAction === null || newAction === undefined ) {
                            return
                        }
                        dispatch( newAction )
                    }
                } )
                observersSubscriptions.push( subscription )
            } )
        },
    } )

    const subscribe = ( subscribeFunction: SubscribeFunction<T> ): () => void => {
        const subscription = action.subscribe( { next: newAction => subscribeFunction( newAction as T ) } )
        return () => {
            subscription.unsubscribe()
        }
    }

    const addObserver = ( type: ActionType<T>, observerFunction: ObserverFunction<T> ) => createObserver<T>( type, observerFunction )( observers, observersListener )

    const addObservers = ( newObservers: Array<RxObserver<T>> ) => {
        newObservers.forEach( observer => observer( observers, observersListener ) )
    }

    const dispatch = ( newAction: T ) => {
        const next = ( val: T ): any => action.next( val ) 
        /**
         * If provided next action is null or undefined,
         * don't dispatch anything.
         */
        if ( newAction === null || newAction === undefined ) {
            return
        }

        appliedMiddleware ? appliedMiddleware( 
            ( { getState, subscribe, dispatch, addObserver } ) as RxStore<S, T> 
        )( next )( newAction ) : next( newAction )
    }

    return { getState, subscribe, dispatch, addObserver, addObservers } as RxStore<S, T>
}

export default createRxStore
