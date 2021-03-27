import { BehaviorSubject, from, Observable, OperatorFunction, Subscription } from 'rxjs'
import { pipeFromArray } from 'rxjs/internal/util/pipe'
import { filter } from 'rxjs/operators'
import { RxJsStore } from '#types'

const createRxjsStore = <
    StoreState extends Record<string, any>,
    Action extends { type: string, [key: string]: any },
    SubscribeFunction extends ( store: StoreState ) => any,
    WatchFunction = ( _pipe: ( ...args: Array<OperatorFunction<Action, any>> ) => Array<OperatorFunction<unknown, unknown>> ) => void
>(
    rootReducer: ( state: StoreState , action: Action ) => StoreState
): RxJsStore<StoreState, SubscribeFunction, Action["type"], Action, WatchFunction> => {
    const state = new BehaviorSubject<StoreState | Record<string, never>>( {} )

    const action = new BehaviorSubject<Action | Record<string, never>>( {} )

    const listeners: Array<SubscribeFunction>  = []

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
                    ( ...args: Array<OperatorFunction<unknown, unknown>> ) : Array<OperatorFunction<unknown, unknown>> => [ ...args ]
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

    const subscribe = ( subscribeFunction: SubscribeFunction ) => {
        listeners.push( subscribeFunction )
    }

    const addWatcher = ( type: Action["type"], watchFunction: WatchFunction ) => {
        watchers.push( { type, watchFunction } )
        watchersListener.next( watchers )
    }

    const _initialState = rootReducer( ( undefined as unknown ) as StoreState, {} as Action )
    state.next( _initialState )

    return { getState, subscribe, dispatch, addWatcher }
}

export default createRxjsStore
