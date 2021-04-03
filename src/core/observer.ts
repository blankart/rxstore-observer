import { Action, ObserverActionType, ObserverFunction } from "../types"

/*@internal*/
export interface ObserverFactoryEntry<S, T extends Action> {
    type: ObserverActionType<T>, 
    observerFunction: ObserverFunction<S, T>  
}

interface ObserverFactory<
    S extends Record<string, any>, 
    T extends Action
> {
    observers: {
        [key: string]: Array<ObserverFactoryEntry<S, T>>
    }
}

export const __observerFactory: ObserverFactory<any, any> =  {
    observers: {}
}

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
 *      Observer( 'LISTEN_TO_ME' )
 *      listenToMeHandler( $action: Observable<T> )  {
 *          return $action.pipe(
 *              mapTo( { type: "I_AM_LISTENING" } )
 *          )
 *      }
 * }
 * 
 * class BroadcastObserver {
 *      Observer( '*' )
 *      allHandler( $action: Observable<T> )  {
 *          return $action.pipe(
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
    T extends Action
>( type?: ObserverActionType<T> ) => ( 
    target: any, 
    name: string, 
    descriptor: TypedPropertyDescriptor<ObserverFunction<S, T>> 
) => {
    if ( typeof descriptor.value !== 'function' ) {
        throw new Error( 'Invalid decoration call. `MakeObservable` only decorates class methods.' )
    }

    type = type || '*'

    if ( ! __observerFactory.observers[ target.constructor.name ] ) {
        __observerFactory.observers[ target.constructor.name ] = []
    }

    __observerFactory.observers[ target.constructor.name ].push( { type, observerFunction: descriptor.value.bind( {} ) } as unknown as { type: ObserverActionType<T>, observerFunction: ObserverFunction<S, T>} )

    return descriptor
}

export default Observer