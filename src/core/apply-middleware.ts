import { Action as GenericAction, RxJsStore, RxjsStoreMiddleware } from '#types'
import shallowEqual from '#utils/shallow-equal'

/**
 * Utility function for composing a middleware function
 * from multiple sources.
 * 
 * @param {...Array<RxjsStoreMiddleware<any, any>>} middlewares 
 * @return {RxjsStoreMiddleware<StoreState, Action>} composed middleware.
 */
const applyMiddleware = <
    StoreState extends Record<string, any>,
    Action extends GenericAction
>( ...middlewares: Array<RxjsStoreMiddleware<any, any>> ): RxjsStoreMiddleware<StoreState, Action> => {
    return ( ( store: RxJsStore<StoreState, Action> ) => ( next: ( action: Action ) => any ) => ( action: Action ): any => {
        if ( middlewares.length === 0 ) {
            throw new Error( 'Invalid `applyMiddleware` parameter. Supply at least 1 middleware function.' )
        }

        let count = 0
        let currentAction: Action | null = null

        const stackNext = ( newAction: Action ) => {
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
    } ) as RxjsStoreMiddleware<StoreState, Action>
}

export default applyMiddleware