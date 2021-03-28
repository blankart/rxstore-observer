import { BehaviorSubject, Observable, Subscription, OperatorFunction } from 'rxjs'
import { pipeFromArray } from 'rxjs/internal/util/pipe'
import { filter } from 'rxjs/operators'
import { 
    RxJsStore, 
    WatchFunction , 
    SubscribeFunction , 
    Action, 
    RxjsStoreMiddleware, 
    RxjsReducer,  
    WatchListener,
    ActionType,
    SubscriptionListener,
    RxjsStoreOperator
} from '../types'
import { INIT, INITType } from '../constants/init'
import createWatchersFactory from './create-watcher-factory'

/**
 * Function for creating an RxJS Store.
 * 
 * @param {RxjsReducer<S, T>} rootReducer 
 * @param {S} initialState
 * 
 * @return {RxJsStore<S, T, SubscribeFunction, WatchFunction>} generated store
 */
const createRxjsStore = <
    S extends Record<string, any>,
    T extends Action,
>(
    rootReducer: RxjsReducer<S, T>,
    initialState?: S,
    appliedMiddleware?: RxjsStoreMiddleware<S, T>
): RxJsStore<S, T, SubscribeFunction<S>, WatchFunction<T>> => {
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

    let listenersCount = 0
    const listeners: Array<SubscriptionListener<S>> = []
    state.subscribe( {
        next: newState => {
            listeners.forEach( listener => listener.subscribeFunction( newState as S ) )
        }
    } )

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

    const watchers: Array<WatchListener<ActionType<T>, WatchFunction<T>>> = []
    const watchersListener = new BehaviorSubject<Array<WatchListener<ActionType<T>, WatchFunction<T>>>>( [] )
    let watchersSubscriptions: Array<Subscription> = []
    watchersListener.subscribe( {
        next: newWatchers => {
            watchersSubscriptions.forEach( subscription => subscription.unsubscribe() )
            watchersSubscriptions = []
            newWatchers.forEach( newWatcher => {
                const pipes = createWatchersFactory<S, T>( state, newWatcher )
                const observable = ( pipeFromArray( [ 
                    filter( ( pipedAction: T ) => pipedAction.type === newWatcher.type ),
                    ...pipes as Array<OperatorFunction<T, unknown | RxjsStoreOperator<any, any>>>
                ] )( action as Observable<T> ) ) as Observable<T>
                
                const subscription = observable.subscribe( {
                    next: newAction => {
                        dispatch( newAction )
                    }
                } )
                watchersSubscriptions.push( subscription )
            } )
        },
    } )

    const subscribe = ( subscribeFunction: SubscribeFunction<S> ): () => void => {
        listeners.push( { key: ++ listenersCount, subscribeFunction } )
        const key = listenersCount
        return () => {
            const newKey = listeners.findIndex( listener => listener.key === key )
            listeners.splice( newKey, 1 )
        }
    }

    const addWatcher = ( type: ActionType<T>, watchFunction: WatchFunction ) => {
        watchers.push( { type, watchFunction } )
        watchersListener.next( watchers )
    }

    const dispatch = ( newAction: T ) => {
        const next = ( val: T ): any => action.next( val ) 
        appliedMiddleware ? appliedMiddleware( 
            ( { getState, subscribe, dispatch, addWatcher } ) as RxJsStore<S, T, SubscribeFunction<S>, WatchFunction<T>> 
        )( next )( newAction ) : next( newAction )
    }

    return { getState, subscribe, dispatch, addWatcher } as RxJsStore<S, T, SubscribeFunction<S>, WatchFunction<T>>
}

export default createRxjsStore
