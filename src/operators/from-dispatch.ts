
import { Action, RxDispatch,RxStoreOperator } from "../types"

type FromDispatchOperator = 'fromState' 

/**
 * An Rxstore Watch custom operator for accessing the dispatch function.
 * This is not an actual implementation of an Rxjs Operator. But instead,
 * it runs a `map` function that accepts the current dispatch function 
 * of the store.
 * 
 * It returns the action objects passed from the observer.
 * 
 * @param {U} dispatchCallback dispatch callback function.
 */
const fromDispatch = <
    T extends Action,
    U extends ( d: RxDispatch<T>, a: T ) => any 
>( dispatchCallback: U  ): RxStoreOperator<FromDispatchOperator> => {
    return {
        key: 'fromState',
        callback: ( args ): Action => {
            dispatchCallback( args.dispatch, args.action as T )
            return args.action
        }
    }
}

export default fromDispatch