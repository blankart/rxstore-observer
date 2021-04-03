import { Action, ObserverFunction, ObserverActionType } from "../types"
import { filter } from 'rxjs/operators'
import { Observable } from 'rxjs'

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
    type: ObserverActionType<T>, 
    observerFunction: ObserverFunction<S,T> 
): ObserverFunction<S, T>  => {
    return ( $action, getState, dispatch ) => {
        const $newActionObservableInstance = observerFunction(
            $action.pipe( 
                filter( passedAction => { 
                    type = type || '*'
                    if ( type === '*' ) {
                        return true
                    }

                    if ( Array.isArray( type ) ) {
                        return type.some( type => type === ( passedAction ).type )
                    }


                    return passedAction.type === type 
                }  )
            ) as Observable<T>,
            getState,
            dispatch
        )

        return $newActionObservableInstance as Observable<T>
    }
}

export default createObserver