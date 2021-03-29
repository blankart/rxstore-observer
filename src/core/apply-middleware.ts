import { Action, RxStore, RxStoreMiddleware } from '../types'
import shallowEqual from '../utils/shallow-equal'

/**
 * Utility function for composing a middleware function
 * from multiple sources.
 * 
 * @param {...Array<RxStoreMiddleware<any, any>>} middlewares 
 * @return {RxStoreMiddleware<S, T>} composed middleware.
 */
const applyMiddleware = <
    S extends Record<string, any>,
    T extends Action
>( ...middlewares: Array<RxStoreMiddleware<any, any>> ): RxStoreMiddleware<S, T> => {
    return ( ( store: RxStore<S, T> ) => ( next: ( action: T ) => any ) => ( action: T ): any => {
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
    } ) as RxStoreMiddleware<S, T>
}

export default applyMiddleware