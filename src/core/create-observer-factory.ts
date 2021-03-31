import { Action, RxStoreOperator, ObserverFunction, ObserveListener, ActionType, RxDispatch } from "../types"
import { OperatorFunction, BehaviorSubject } from "rxjs"
import { map } from 'rxjs/operators'

/** @internal */
const createObserversFactory = <
    S extends Record<string, any>,
    T extends Action
>( 
    state: BehaviorSubject<S>,
    dispatch: RxDispatch<T>,
    observer: ObserveListener<ActionType<T>, ObserverFunction<T>>
): Array<OperatorFunction<T, unknown> | RxStoreOperator<any, any>> => {
    const pipes = ( observer.observerFunction as unknown as ( ...args: any ) => any )( 
        ( ...passedPipes: Array<OperatorFunction<T, unknown> | RxStoreOperator<any, any>> ) : Array<OperatorFunction<T, unknown> | RxStoreOperator<any, any>> => {
            const newPipes: Array<OperatorFunction<T, unknown> | RxStoreOperator<any, any>> = []
            for ( let i = 0; i < passedPipes.length; i ++ ) {
                if ( 
                    typeof passedPipes[ i ] === 'object' && 
                                ( passedPipes[ i ] as RxStoreOperator<any, any> ).key  &&
                                ( passedPipes[ i ] as RxStoreOperator<any, any> ).callback
                ) {
                    newPipes.push(
                        map( ( _action: Action ) => {
                            const store = state.getValue()
                            return ( passedPipes[ i ] as RxStoreOperator<any, any> ).callback( { store, action: _action, dispatch } )  
                        } )
                    )
                } else {
                    newPipes.push( passedPipes[ i ] )
                }
            }
            return newPipes
        }
    ) 

    return pipes
}

export default createObserversFactory