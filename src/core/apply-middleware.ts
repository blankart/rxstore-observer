import { Action as GenericAction, RxJsStore, RxjsStoreMiddleware } from '#types'

const applyMiddleware = <
    StoreState extends Record<string, any> = Record<string, any>,
    Action extends GenericAction = GenericAction
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

            if ( JSON.stringify( currentAction ) !== JSON.stringify( newAction ) ) {
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