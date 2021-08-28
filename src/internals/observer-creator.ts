import { BehaviorSubject, Subject, Subscription } from 'rxjs'
import { Action, ObserverFunction } from '../types'

/**@internal */
const observerCreator = <
    S extends Record<string, any>, 
    T extends Action,
    U extends T = T,
    V extends Action = Extract<T, U>,
>( 
    observerFunction: ObserverFunction<S, T, V>, 
    action$: Subject<T>, 
    state$: BehaviorSubject<S>, 
): Subscription => {
    const $observerable = observerFunction( action$, state$ )
    const subscription = $observerable.subscribe( {
        next: newAction => {
            action$.next( newAction as unknown as T )
        }
    } )

    return subscription
}

export default observerCreator