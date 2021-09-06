import { AnyAction, RxDispatch, RxReducer, RxStore, RxStoreCreator, RxStoreEnhancer, RxStoreMiddleware } from '../types'
import compose from './compose'

/**
 * Utility function for composing a middleware function
 * from multiple sources.
 * 
 * @param {...Array<RxStoreMiddleware<any, any>>} middlewares 
 * @return {RxStoreMiddleware<S, T>} composed middleware.
 */
const applyMiddleware = <
    S extends Record<string, any>,
    T extends AnyAction
>( ...middlewares: Array<RxStoreMiddleware<any, any>> ): RxStoreEnhancer<S, T> => {
    return ( creator: RxStoreCreator<S, T> ): RxStoreCreator<S, T> => {
        return ( reducer: RxReducer<S, T>, initialState: S | undefined, effects ): RxStore<S, T> => {
            const store = creator( reducer, initialState, effects )
            let dispatch: RxDispatch<any> = () => { throw new Error( `Dispatch function is still being constructed inside the enhancer function.` ) }
            const middlewareMap = middlewares.map( middleware => middleware( { getState: store.getState, dispatch: ( action, ...args ) => dispatch( action, ...args ) } as RxStore<S, T> ) )
            dispatch = compose<typeof dispatch>( ...middlewareMap as [ typeof dispatch ] )( store.dispatch )
            store.dispatch = dispatch
            return store
        }
    }
}

export default applyMiddleware