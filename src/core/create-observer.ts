import { Action, ActionType, RxObserver, ObserverFunction } from "../types"

/**
 * Creates a new instance of observer which can be
 * passed inside `store.addObservers`
 * 
 * @param {ActionType<T>}type 
 * @param {ObserverFunction<T>} observerFunction 
 */
const createObserver = <
    T extends Action
>( 
    type: ActionType<T>, 
    observerFunction: ObserverFunction<T> 
): RxObserver<T>  => {
    return ( observers, observersListener ) => {
        observers.push( { type, observerFunction } )
        observersListener.next( observers )
    }
}

export default createObserver