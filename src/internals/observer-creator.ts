import { Observable, Subscription } from 'rxjs'
import { Action, ObserverFunction, RxDispatch } from '../types'

/**@internal */
const observerCreator = <
    S extends Record<string, any>, 
    T extends Action,
    U extends T = T,
    V extends Action = Extract<T, U>,
>( 
    observerFunction: ObserverFunction<S, T, V>, 
    $action: Observable<V>, 
    getState: () => S, 
    dispatch: RxDispatch<T> 
): Subscription => {
    const $observerable = observerFunction( $action, getState, dispatch )
    const subscription = $observerable.subscribe( {
        next: newAction => {
            dispatch( newAction as unknown as T )
        }
    } )

    return subscription
}

export default observerCreator