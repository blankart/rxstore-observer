import { BehaviorSubject, Observable, OperatorFunction, Subscription } from 'rxjs'
import { pipeFromArray } from 'rxjs/internal/util/pipe'
import { filter, map } from 'rxjs/operators'
import { RxJsStore, WatchFunction , SubscribeFunction , Action as ActionGeneric, RxjsStoreOperator, RxjsStoreMiddleware  } from '#types'

/**
 * Function for creating an RxJS Store.
 * 
 * @param {( state: StoreState , action: Action ) => StoreState} rootReducer 
 * @param {StoreState} initialState
 * 
 * @return {RxJsStore<StoreState, Action, SubscribeFunction, WatchFunction>} generated store
 */
const createRxjsStore = <
    StoreState = Record<string, any>,
    Action extends ActionGeneric = ActionGeneric,
>(
    rootReducer: ( state: StoreState , action: Action ) => StoreState,
    initialState?: StoreState,
    appliedMiddleware?: RxjsStoreMiddleware<StoreState, Action>
): RxJsStore<StoreState, Action, SubscribeFunction, WatchFunction> => {
    if ( ! initialState ) {
        initialState = rootReducer( ( undefined as unknown ) as StoreState, {} as Action )
    }

    const state = new BehaviorSubject<StoreState>( initialState as StoreState )

    const action = new BehaviorSubject<Action | { type: 'INITIALIZE_STORE' }>( { type: 'INITIALIZE_STORE' } )

    let count = 0
    const listeners: Array<{ key: number, subscribeFunction: SubscribeFunction<StoreState> }> = []

    const watchers: Array<{ type: Action[ "type" ], watchFunction: WatchFunction}> = []
    const watchersListener = new BehaviorSubject<Array<{ type: Action[ "type" ], watchFunction: WatchFunction }>>( [] )
    let watchersSubscriptions: Array<Subscription> = []

    const getState = () => state.getValue() as StoreState

    state.subscribe( {
        next: _state => {
            listeners.forEach( listener => listener.subscribeFunction( _state as StoreState ) )
        }
    } )

    action.subscribe( {
        next: _action => {
            const newState = rootReducer( getState(), _action as Action )
            state.next( newState )
        }
    } )

    watchersListener.subscribe( {
        next: _watchers => {
            watchersSubscriptions.forEach( subscription => subscription.unsubscribe() )
            watchersSubscriptions = []
            _watchers.forEach( _watcher => {
                const pipes = ( _watcher.watchFunction as unknown as ( ...args: any ) => any )( 
                    ( ...args: Array<OperatorFunction<Action, unknown> | RxjsStoreOperator<any, any>> ) : Array<OperatorFunction<Action, unknown> | RxjsStoreOperator<any, any>> => {
                        const _args: Array<OperatorFunction<Action, unknown> | RxjsStoreOperator<any, any>> = []
                        for ( let i = 0; i < args.length; i ++ ) {
                            if ( 
                                typeof args[ i ] === 'object' && 
                                ( args[ i ] as RxjsStoreOperator<any, any> ).key  &&
                                ( args[ i ] as RxjsStoreOperator<any, any> ).callback
                            ) {
                                _args.push(
                                    map( ( _action: Action ) => {
                                        const store = state.getValue()
                                        return ( args[ i ] as RxjsStoreOperator<any, any> ).callback( { store, action: _action } )  
                                    } )
                                )
                            } else {
                                _args.push( args[ i ] )
                            }
                        }
                        return _args
                    }
                ) 

                const observable = ( pipeFromArray( [ 
                    filter( ( _action: Action ) => _action.type === _watcher.type ),
                    ...pipes
                ] )( action ) ) as Observable<Action>
                
                const subscription = observable.subscribe( {
                    next: _action => {
                        dispatch( _action )
                    }
                } )
                watchersSubscriptions.push( subscription )
            } )
        },
    } )

    const subscribe = ( subscribeFunction: SubscribeFunction<StoreState> ): () => any => {
        listeners.push( { key: ++ count, subscribeFunction } )
        const key = count
        return () => {
            const _index = listeners.findIndex( listener => listener.key === key )
            listeners.splice( _index, 1 )
        }
    }

    const addWatcher = ( type: Action["type"], watchFunction: WatchFunction ) => {
        watchers.push( { type, watchFunction } )
        watchersListener.next( watchers )
    }

    const dispatch = ( newAction: Action ) => {
        const next = ( val: Action ) => action.next( val ) 
        appliedMiddleware ? appliedMiddleware( { getState, subscribe, dispatch, addWatcher } )( next )( newAction ) : next( newAction )
    }

    return { getState, subscribe, dispatch, addWatcher }
}

export default createRxjsStore
