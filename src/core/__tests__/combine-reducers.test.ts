import combineReducers from '../combine-reducers'
import createRxStore from '../create-rx-store'

describe( 'combineReducers', () => {
    test( 'multiple reducers to return the right state', () => {
        type IState1 = boolean
        type IState2 =  boolean

        interface Action1 {
            type: "ACTION_1"
            payload: boolean
        }

        interface Action2 {
            type: "ACTION_2"
            payload: boolean
        }

        const reducer1 = ( state: IState1 = false, action: Action1 ) => {
            switch ( action.type ) {
            case "ACTION_1":
                return action.payload
            default:
                return state
            }
        }

        const reducer2 = ( state: IState2 = false, action: Action2 ) => {
            switch ( action.type ) {
            case "ACTION_2":
                return action.payload
            default:
                return state
            }
        }

        const combinedReducer = combineReducers<{ action1: IState1, action2: IState2 }, Action1 | Action2>( {
            action1: reducer1,
            action2: reducer2,
        } )

        const dummyStore = createRxStore( combinedReducer )

        expect( dummyStore.getState() ).toEqual( {
            action1: false,
            action2: false,
        } )
        dummyStore.dispatch( { type: "ACTION_1", payload: true } )
        dummyStore.dispatch( { type: "ACTION_2", payload: true } )

        expect( dummyStore.getState().action1 ).toBeTruthy()
        expect( dummyStore.getState().action2 ).toBeTruthy()
    } )
} )