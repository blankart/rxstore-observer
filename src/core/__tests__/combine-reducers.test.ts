import combineReducers from '../combine-reducers'
import createRxStore from '../create-rxjs-store'

describe( 'combineReducers', () => {
    test( 'multiple reducers to return the right state', () => {
        type IState1 = boolean
        type IState2 =  boolean

        interface Action {
            type: "ACTION_1" | "ACTION_2"
            payload: boolean
        }

        const reducer1 = ( state: IState1 = false, action: Action ) => {
            switch ( action.type ) {
            case "ACTION_1":
                return action.payload
            default:
                return state
            }
        }

        const reducer2 = ( state: IState2 = false, action: Action ) => {
            switch ( action.type ) {
            case "ACTION_2":
                return action.payload
            default:
                return state
            }
        }
        const combinedReducer = combineReducers( {
            action1: reducer1,
            action2: reducer2,
        } )

        const dummyStore = createRxStore( combinedReducer )

        expect( dummyStore.getState().action1 ).toBeFalsy()
        expect( dummyStore.getState().action2 ).toBeFalsy()

        dummyStore.dispatch( { type: "ACTION_1", payload: true } )
        dummyStore.dispatch( { type: "ACTION_2", payload: true } )

        expect( dummyStore.getState().action1 ).toBeTruthy()
        expect( dummyStore.getState().action2 ).toBeTruthy()
    } )
} )