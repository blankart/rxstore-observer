import { BehaviorSubject, from, Observable, OperatorFunction, Subscription } from 'rxjs'
import { pipeFromArray } from 'rxjs/internal/util/pipe'
import { filter } from 'rxjs/operators'
import { RxJsStore, WatchFunction , SubscribeFunction , Action as ActionGeneric  } from '#types'

/**
 * Function for creating an RxJS Store.
 * 
 * @param {( state: StoreState , action: Action ) => StoreState} rootReducer 
 * 
 * @return {RxJsStore<StoreState, Action, SubscribeFunction, WatchFunction>} generated store
 */
const createRxjsStore = <
    StoreState = Record<string, any>,
    Action extends ActionGeneric = ActionGeneric,
>(
    rootReducer: ( state: StoreState , action: Action ) => StoreState
): RxJsStore<StoreState, Action, SubscribeFunction, WatchFunction> => {
    const _initialState = rootReducer( ( undefined as unknown ) as StoreState, {} as Action )
    const state = new BehaviorSubject<StoreState>( _initialState )

    const action = new BehaviorSubject<Action | { type: 'INITIALIZE_STORE'}>( { type: 'INITIALIZE_STORE' } )

    const listeners: Array<SubscribeFunction<StoreState>> = []

    const watchers: Array<{ type: Action["type"], watchFunction: WatchFunction}> = []
    const watchersListener = new BehaviorSubject<Array<{ type: Action["type"], watchFunction: WatchFunction }>>( [] )
    let watchersSubscriptions: Array<Subscription> = []

    const getState = () => state.getValue() as StoreState

    state.subscribe( {
        next: _state => {
            listeners.forEach( listener => listener( _state as StoreState ) )
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
                    ( ...args: Array<OperatorFunction<Action, unknown>> ) : Array<OperatorFunction<Action, unknown>> => [ ...args ]
                ) 

                const observable = ( pipeFromArray( [ 
                    filter( ( _action: Action ) => _action.type === _watcher.type ),
                    ...pipes
                ] )( from( action ) ) ) as Observable<Action>
                
                const subscription = observable.subscribe( {
                    next: _action => {
                        const newState = rootReducer( getState(), _action as Action )
                        state.next( newState )
                    }
                } )
                watchersSubscriptions.push( subscription )
            } )
        },
    } )

    const dispatch = ( newAction: Action ) => {
        action.next( newAction )
    }

    const subscribe = ( subscribeFunction: SubscribeFunction<StoreState> ) => {
        listeners.push( subscribeFunction )
    }

    const addWatcher = ( type: Action["type"], watchFunction: WatchFunction ) => {
        watchers.push( { type, watchFunction } )
        watchersListener.next( watchers )
    }

    return { getState, subscribe, dispatch, addWatcher }
}

export default createRxjsStore
