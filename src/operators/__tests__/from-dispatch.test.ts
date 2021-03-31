import { mapTo } from 'rxjs/operators'
import { createRxStore } from '../../core'
import { reducer } from '../../templates/mock-store'
import fromDispatch from '../from-dispatch'

describe( 'fromDispatch', () => {
    test( 'fromState should yield the current state value', () => {
        const dummyStore = createRxStore( reducer )

        dummyStore.addObserver( 'CHANGE_DUMMY_FIELD_1', pipe => pipe(
            fromDispatch( ( dispatch, action ) => {
                dispatch( { type: "CHANGE_DUMMY_FIELD_2", payload: action.payload } )
                dispatch( { type: "CHANGE_DUMMY_FIELD_3", payload: action.payload } )
            } ),
            mapTo( { type: "DONE" } )
        ) )

        dummyStore.dispatch( { type: "CHANGE_DUMMY_FIELD_1", payload: 'Changed value' } )

        expect( dummyStore.getState().dummyField1 ).toBe( 'Changed value' )
        expect( dummyStore.getState().dummyField2 ).toBe( 'Changed value' )
        expect( dummyStore.getState().dummyField3 ).toBe( 'Changed value' )

        dummyStore.dispatch( { type: "CHANGE_DUMMY_FIELD_1", payload: 'Changed value 2' } )

        expect( dummyStore.getState().dummyField1 ).toBe( 'Changed value 2' )
        expect( dummyStore.getState().dummyField2 ).toBe( 'Changed value 2' )
        expect( dummyStore.getState().dummyField3 ).toBe( 'Changed value 2' )
    } )
} )