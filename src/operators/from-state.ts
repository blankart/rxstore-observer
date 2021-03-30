import { Action, RxStoreOperator } from "../types"

type FromStateOperator = 'fromState' 

/**
 * An Rxstore Watch custom operator for accessing the store state.
 * This is not an actual implementation of an Rxjs Operator. But instead,
 * it runs a `map` function that accepts the current state of the store.
 * 
 * It does not accept any return function. Instead, the current action object
 * is passed to the next operator function.
 * 
 * @param {U} stateCallback stateCallback callback function.
 */
const fromState = <
    S extends Record<string, any>,
    T extends Action,
    U extends ( state: S, action: T ) => any 
>( stateCallback: U  ): RxStoreOperator<FromStateOperator> => {
    return {
        key: 'fromState',
        callback: ( args ): S | Partial<S> => {
            return stateCallback( args.store as S, args.action as T )
        }
    }
}

export default fromState