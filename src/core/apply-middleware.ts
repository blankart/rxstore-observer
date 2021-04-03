import { Action, RxDispatch, RxReducer, RxStore, RxStoreCreator, RxStoreEnhancer, RxStoreMiddleware } from '../types'
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
    T extends Action
>( ...middlewares: Array<RxStoreMiddleware<any, any>> ): RxStoreEnhancer<S, T> => {
    return ( creator: RxStoreCreator<S, T> ): RxStoreCreator<S, T> => {
        return ( reducer: RxReducer<S, T>, initialState: S | undefined ): RxStore<S, T> => {
            const store = creator( reducer, initialState )
            let dispatch: RxDispatch<any> = () => { throw new Error( `Dispatch function is still being constructed inside the enhancer function.` ) }
            const middlewareMap = middlewares.map( middleware => middleware( { getState: store.getState, dispatch: ( action, ...args ) => dispatch( action, ...args ) } as RxStore<S, T> ) )
            dispatch = compose<typeof dispatch>( ...middlewareMap as [ typeof dispatch ] )( store.dispatch )
            
            return {
                ...store,
                dispatch
            }
        }
    }
}

export default applyMiddleware