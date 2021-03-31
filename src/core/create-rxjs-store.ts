import { BehaviorSubject, Observable, Subscription, OperatorFunction } from 'rxjs'
import { pipeFromArray } from 'rxjs/internal/util/pipe'
import { filter } from 'rxjs/operators'
import { 
    RxStore, 
    WatchFunction , 
    SubscribeFunction , 
    Action, 
    RxStoreMiddleware, 
    RxReducer,  
    WatchListener,
    ActionType,
    RxStoreOperator,
    RxWatcher
} from '../types'
import { INIT, INITType } from '../constants/init'
import createWatchersFactory from './create-watcher-factory'
import createWatcher from './create-watcher'

/**
 * Function for creating an RxJS Store.
 * 
 * @param {RxReducer<S, T>} rootReducer 
 * @param {S} initialState
 * 
 * @return {RxStore<S, T, SubscribeFunction, WatchFunction>} generated store
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

    const watchers: Array<WatchListener<ActionType<T>, WatchFunction<T>>> = []
    const watchersListener = new BehaviorSubject<Array<WatchListener<ActionType<T>, WatchFunction<T>>>>( [] )
    let watchersSubscriptions: Array<Subscription> = []
    watchersListener.subscribe( {
        next: newWatchers => {
            watchersSubscriptions.forEach( subscription => subscription.unsubscribe() )
            watchersSubscriptions = []
            newWatchers.forEach( newWatcher => {
                const pipes = createWatchersFactory<S, T>( state, dispatch, newWatcher )
                const observable = ( pipeFromArray( [ 
                    filter( ( pipedAction: T ) => pipedAction.type === newWatcher.type ),
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
                watchersSubscriptions.push( subscription )
            } )
        },
    } )

    const subscribe = ( subscribeFunction: SubscribeFunction<T> ): () => void => {
        const subscription = action.subscribe( { next: newAction => subscribeFunction( newAction as T ) } )
        return () => {
            subscription.unsubscribe()
        }
    }

    const addWatcher = ( type: ActionType<T>, watchFunction: WatchFunction<T> ) => createWatcher<T>( type, watchFunction )( watchers, watchersListener )

    const addWatchers = ( newWatchers: Array<RxWatcher<T>> ) => {
        newWatchers.forEach( watcher => watcher( watchers, watchersListener ) )
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
            ( { getState, subscribe, dispatch, addWatcher } ) as RxStore<S, T> 
        )( next )( newAction ) : next( newAction )
    }

    return { getState, subscribe, dispatch, addWatcher, addWatchers } as RxStore<S, T>
}

export default createRxStore
