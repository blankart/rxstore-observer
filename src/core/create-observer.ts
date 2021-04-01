import { Action, ActionType, RxObserver, ObserverFunction } from "../types"

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
    type: ActionType<T> | "*" | Array<ActionType<T>>, 
    observerFunction: ObserverFunction<S,T> 
): RxObserver<S, T>  => {
    return ( observers, observersListener ) => {
        observers.push( { type, observerFunction } )
        observersListener.next( observers )
    }
}

export default createObserver