import { Action, RxJsStore, RxjsStoreMiddleware } from '../types'
import shallowEqual from '../utils/shallow-equal'

/**
 * Utility function for composing a middleware function
 * from multiple sources.
 * 
 * @param {...Array<RxjsStoreMiddleware<any, any>>} middlewares 
 * @return {RxjsStoreMiddleware<S, T>} composed middleware.
 */
const applyMiddleware = <
    S extends Record<string, any>,
    T extends Action
>( ...middlewares: Array<RxjsStoreMiddleware<any, any>> ): RxjsStoreMiddleware<S, T> => {
    return ( ( store: RxJsStore<S, T> ) => ( next: ( action: T ) => any ) => ( action: T ): any => {
        if ( middlewares.length === 0 ) {
            throw new Error( 'Invalid `applyMiddleware` parameter. Supply at least 1 middleware function.' )
        }

        let count = 0
        let currentAction: T | null = null

        const stackNext = ( newAction: T ) => {
            count ++

            if ( currentAction === null ) {
                currentAction = newAction
            }

            if ( ! shallowEqual( currentAction, newAction ) || JSON.stringify( currentAction ) !== JSON.stringify( newAction ) ) {
                next( currentAction )
                currentAction = newAction
            }

            if ( middlewares[ count ] ) {
                middlewares[ count ]( store )( stackNext )( action )
            } else {
                count = 0
                next( currentAction )
            }
        }

        middlewares[ count ]( store )( stackNext )( action )
    } ) as RxjsStoreMiddleware<S, T>
}

export default applyMiddleware