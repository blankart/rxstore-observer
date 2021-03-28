import { Action, RxjsStoreOperator, WatchFunction, WatchListener, ActionType } from "../types"
import { OperatorFunction, BehaviorSubject } from "rxjs"
import { map } from 'rxjs/operators'

/** @internal */
const createWatchersFactory = <
    S extends Record<string, any>,
    T extends Action
>( 
    state: BehaviorSubject<S>,
    watcher: WatchListener<ActionType<T>, WatchFunction<T>>
): Array<OperatorFunction<T, unknown> | RxjsStoreOperator<any, any>> => {
    const pipes = ( watcher.watchFunction as unknown as ( ...args: any ) => any )( 
        ( ...passedPipes: Array<OperatorFunction<T, unknown> | RxjsStoreOperator<any, any>> ) : Array<OperatorFunction<T, unknown> | RxjsStoreOperator<any, any>> => {
            const newPipes: Array<OperatorFunction<T, unknown> | RxjsStoreOperator<any, any>> = []
            for ( let i = 0; i < passedPipes.length; i ++ ) {
                if ( 
                    typeof passedPipes[ i ] === 'object' && 
                                ( passedPipes[ i ] as RxjsStoreOperator<any, any> ).key  &&
                                ( passedPipes[ i ] as RxjsStoreOperator<any, any> ).callback
                ) {
                    newPipes.push(
                        map( ( _action: Action ) => {
                            const store = state.getValue()
                            return ( passedPipes[ i ] as RxjsStoreOperator<any, any> ).callback( { store, action: _action } )  
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

export default createWatchersFactory