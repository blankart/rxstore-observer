import { Action, RxReducer, RxReducersMapObject } from '../types'

/**
 * This function combines all object reducers into a single reducer.
 * 
 * @example
 * ```
 * const reducer1 = ( state: IState1 = false, action: Action ) => {
 *     switch ( action.type ) {
 *     case "ACTION_1":
 *         return action.payload
 *    default:
 *         return state
 *   }
 * }
 * const reducer2 = ( state: IState2 = false, action: Action ) => {
 *     switch ( action.type ) {
 *     case "ACTION_2":
 *         return action.payload
 *    default:
 *         return state
 *   }
 * }
 * 
 * const combinedReducer = combineReducers({
 *  action1: reducer1,
 *  action2: reducer2
 * })
 * ```
 * 
 * @param {RxReducersMapObject<S, T>} reducers 
 * 
 * @return {RxReducer<S, T>} generated single reducer.
 */
const combineReducers = <
    S extends Record<string, any>,
    T extends Action
>( reducers: RxReducersMapObject<S, any> ): RxReducer<S, T> => {
    const reducerKeys = Object.keys( reducers ) as Array<keyof RxReducersMapObject<S, T>>

    return ( state: S | undefined = {} as S, action: T ): S => {
        const nextState: S = {} as S

        for ( let i = 0; i < reducerKeys.length; i ++ ) {
            const key = reducerKeys[ i ]
            const reducer = reducers[ key ]
            const previousStateForKey = ( state as S )[ key ]
            const nextStateForKey: S[ keyof S ] = reducer( previousStateForKey, action )
            nextState[ key ] = nextStateForKey 
        }

        return nextState
    }
}

export default combineReducers

