import { Action, ObserverFunction } from "../types"
import { __observerFactory } from '../internals/__observer-factory'

/**
 * A class method decorator implementation of addObservers.
 * 
 * @example
 * import { Observer } from 'rxstore-observer'
 * import { mapTo } from 'rxstore/operators'
 * import store from './store'
 * import { Store, Action } from './types'
 * import { Observable } from 'rxjs'
 *
 * class ListenObserver {
 *      Observer()
 *      listenToMeHandler( action$: Observable<T> )  {
 *          return action$.pipe(
 *              mapTo( { type: "I_AM_LISTENING" } )
 *          )
 *      }
 * }
 * 
 * class BroadcastObserver {
 *      Observer()
 *      allHandler( action$: Observable<T> )  {
 *          return action$.pipe(
 *              mapTo( { type: "BROADCAST_MESSAGE", message: "An action has been dispatched." } )
 *          )
 *      }
 * }
 * 
 * store.addObservers( [ ListenObserver, BroadcastObserver ] )
 * @param type 
 */
const Observer = <
    S extends Record<string, any>, 
    T extends Action,
    U extends Action = T,
    V extends Action = Extract<T, U>
> () => ( 
    target: any, 
    name: string, 
    descriptor: TypedPropertyDescriptor<any> 
) => {
    if ( typeof descriptor.value !== 'function' ) {
        throw new Error( 'Invalid decoration call. `MakeObservable` only decorates class methods.' )
    }

    if ( ! __observerFactory.observers[ target.constructor.name ] ) {
        __observerFactory.observers[ target.constructor.name ] = []
    }

    __observerFactory.observers[ target.constructor.name ]
        .push( descriptor.value.bind( {} ) as ObserverFunction<S, T, V> )

    return descriptor
}

export default Observer