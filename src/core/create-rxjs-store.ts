import { BehaviorSubject, Observable, Subscription, OperatorFunction } from 'rxjs'
import { pipeFromArray } from 'rxjs/internal/util/pipe'
import { filter } from 'rxjs/operators'
import { 
    RxJsStore, 
    WatchFunction , 
    SubscribeFunction , 
    Action as ActionGeneric, 
    RxjsStoreMiddleware, 
    RxjsReducer,  
    WatchListener,
    ActionType,
    SubscriptionListener,
    RxjsStoreOperator
} from '#types'
import { INIT, INITType } from '#constants/init'
import createWatchersFactory from './create-watcher-factory'

/**
 * Function for creating an RxJS Store.
 * 
 * @param {RxjsReducer<StoreState, Action>} rootReducer 
 * @param {StoreState} initialState
 * 
 * @return {RxJsStore<StoreState, Action, SubscribeFunction, WatchFunction>} generated store
 */
const createRxjsStore = <
    StoreState extends Record<string, any>,
    Action extends ActionGeneric,
>(
    rootReducer: RxjsReducer<StoreState, Action>,
    initialState?: StoreState,
    appliedMiddleware?: RxjsStoreMiddleware<StoreState, Action>
): RxJsStore<StoreState, Action, SubscribeFunction<StoreState>, WatchFunction<Action>> => {
    if ( typeof rootReducer !== 'function' ) {
        throw new Error( 'Invalid reducer parameter. Reducer must be of type `function`.' )
    }
    /**
     * If no initial state is passed, it is already
     * assumed that the initial state is passed as
     * the default value of the reducer.
     */
    if ( ! initialState ) {
        initialState = rootReducer( ( undefined as unknown ) as StoreState, {} as Action )
    }

    /**
     * State handlers. This allows us to store all global states
     * into a single entity. Ideally, global state is of type object.
     * 
     * BehaviorSubject is used to subscribe to state changes. 
     */
    const state = new BehaviorSubject<StoreState>( initialState as StoreState )
    const getState = () => state.getValue() as StoreState

    let listenersCount = 0
    const listeners: Array<SubscriptionListener<StoreState>> = []
    state.subscribe( {
        next: newState => {
            listeners.forEach( listener => listener.subscribeFunction( newState as StoreState ) )
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
    const action = new BehaviorSubject<Action | { type: INITType }>( { type: INIT } )
    action.subscribe( {
        next: _action => {
            const newState = rootReducer( getState(), _action as Action )
            state.next( newState )
        }
    } )

    const watchers: Array<WatchListener<ActionType<Action>, WatchFunction<Action>>> = []
    const watchersListener = new BehaviorSubject<Array<WatchListener<ActionType<Action>, WatchFunction<Action>>>>( [] )
    let watchersSubscriptions: Array<Subscription> = []
    watchersListener.subscribe( {
        next: newWatchers => {
            watchersSubscriptions.forEach( subscription => subscription.unsubscribe() )
            watchersSubscriptions = []
            newWatchers.forEach( newWatcher => {
                const pipes = createWatchersFactory<StoreState, Action>( state, newWatcher )
                const observable = ( pipeFromArray( [ 
                    filter( ( pipedAction: Action ) => pipedAction.type === newWatcher.type ),
                    ...pipes as Array<OperatorFunction<Action, unknown | RxjsStoreOperator<any, any>>>
                ] )( action as Observable<Action> ) ) as Observable<Action>
                
                const subscription = observable.subscribe( {
                    next: newAction => {
                        dispatch( newAction )
                    }
                } )
                watchersSubscriptions.push( subscription )
            } )
        },
    } )

    const subscribe = ( subscribeFunction: SubscribeFunction<StoreState> ): () => void => {
        listeners.push( { key: ++ listenersCount, subscribeFunction } )
        const key = listenersCount
        return () => {
            const newKey = listeners.findIndex( listener => listener.key === key )
            listeners.splice( newKey, 1 )
        }
    }

    const addWatcher = ( type: ActionType<Action>, watchFunction: WatchFunction ) => {
        watchers.push( { type, watchFunction } )
        watchersListener.next( watchers )
    }

    const dispatch = ( newAction: Action ) => {
        const next = ( val: Action ): any => action.next( val ) 
        appliedMiddleware ? appliedMiddleware( 
            ( { getState, subscribe, dispatch, addWatcher } ) as RxJsStore<StoreState, Action, SubscribeFunction<StoreState>, WatchFunction<Action>> 
        )( next )( newAction ) : next( newAction )
    }

    return { getState, subscribe, dispatch, addWatcher } as RxJsStore<StoreState, Action, SubscribeFunction<StoreState>, WatchFunction<Action>>
}

export default createRxjsStore
