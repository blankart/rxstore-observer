import { Action, ObserverFunction, ObserverActionType, RxDispatch } from "../types"
import { Observable, Subscription } from 'rxjs'
import observerCreator from "../internals/observer-creator"

/**
 * Creates a new instance of observer which can be
 * passed inside `store.addObservers`
 * 
 * @param {ActionType<T>}type 
 * @param {ObserverFunction<T>} observerFunction 
 */
const createObserver = <
    S extends Record<string, any>,
    T extends Action
>( 
    type: ObserverActionType<T>, 
    observerFunction: ObserverFunction<S,T> 
) => {
    return ( $action: Observable<T>, getState: () => S, dispatch: RxDispatch<T> ): Subscription => observerCreator( type, observerFunction, $action, getState, dispatch )
}

export default createObserver