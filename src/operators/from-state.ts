import { Action, RxStoreOperator } from "../types"

type FromStateOperator = 'fromState' 

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