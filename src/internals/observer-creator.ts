import { Observable, Subscription } from 'rxjs'
import { filter } from 'rxjs/operators'
import { Action, ObserverActionType, ObserverFunction, RxDispatch } from '../types'

/**@internal */
const observerCreator = <
    S extends Record<string, any>, 
    T extends Action
>( 
    type: ObserverActionType<T>, 
    observerFunction: ObserverFunction<S, T>, 
    $action: Observable<T>, 
    getState: () => S, 
    dispatch: RxDispatch<T> 
): Subscription => {
    const $actionWithFilteredType = $action.pipe(
        filter( action => {
            type = type || '*'

            if ( Array.isArray( type ) ) {
                return type.some( t => t === action.type )
            }

            if ( type === '*' || type === action.type ) {
                return true
            }

            return false
        } )
    )
    const $observerable = observerFunction( $actionWithFilteredType, getState, dispatch )
    const subscription = $observerable.subscribe( {
        next: newAction => {
            /**
              * If provided next action is null or undefined,
              * don't dispatch anything.
              */
            if ( newAction === null || newAction === undefined ) {
                return
            }
            dispatch( newAction )
        }
    } )

    return subscription
}

export default observerCreator