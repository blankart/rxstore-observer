import { Action, ObserverFunction, RxDispatch } from "../types"
import { Observable, Subscription } from 'rxjs'
import observerCreator from "../internals/observer-creator"

/**
 * Helper function for creating a new action
 * observable stream which can be passed inside
 * `store.addObservers`.
 * 
 * Technically, a normal function can be passed inside
 * `store.addObservers`
 * @example
 * ```
 * const sampleObserver = ($action) => {
 *      return $action.pipe( 
 *          filter( action => action.type === 'START' ),
 *          mapTo ( { type: "DONE" } ) 
 *      )
 * }
 * 
 * store.addObservers( [ sampleObserver ] )
 * 
 * ```
 * But using createObserver makes the function more verbose.
 * 
 * @param {ActionType<T>}type 
 * @param {ObserverFunction<T>} observerFunction 
 */
const createObserver = <
    S extends Record<string, any>,
    T extends Action,
    U extends Action = T,
    V extends Action = Extract<T, U>
>( 
    observerFunction: ObserverFunction<S,T,V> 
) => {
    return ( $action: Observable<V>, getState: () => S, dispatch: RxDispatch<T> ): Subscription => observerCreator( observerFunction, $action, getState, dispatch )
}

export default createObserver