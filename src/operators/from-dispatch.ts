
import { Action, RxDispatch,RxStoreOperator } from "../types"

type FromDispatchOperator = 'fromState' 

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