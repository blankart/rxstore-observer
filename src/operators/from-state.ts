import { Action, RxjsStoreOperator } from "#types"

type RxjsStoreOperatorFromStateKey = 'fromState' 

const fromState = <
    Store extends Record<string, any> = Record<string, any>,
    Callback extends ( state: Store, action: Action ) => Partial<Store> = ( state: Store ) => Partial<Store> 
>( stateCallback: Callback  ): RxjsStoreOperator<RxjsStoreOperatorFromStateKey> => {
    return {
        key: 'fromState',
        callback: ( args: any ): Store | Partial<Store> => {
            return stateCallback( args.store, args.action )
        }
    }
}

export default fromState