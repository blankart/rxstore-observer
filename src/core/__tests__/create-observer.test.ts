import createRxStore from '../create-rx-store'
import { map } from 'rxjs/operators'
import { Action, reducer, State, ChangeDummyField2Action, ChangeDummyField3Action } from '../../templates/mock-store'
import createObserver from '../create-observer'
import ofType from '../of-type'

describe( 'createObserver', () => {
    test( 'Register createObserver instance inside addObservers', () => {
        const dummyStore = createRxStore( reducer )

        const dummyObserver1 = createObserver<State, Action, ChangeDummyField2Action>( $action => $action.pipe(
            ofType( 'CHANGE_DUMMY_FIELD_1' ),
            map( action => ( { type: 'CHANGE_DUMMY_FIELD_2', payload: ( action as Action ).payload } ) )
        ) )

        const dummyObserver2 = createObserver<State, Action, ChangeDummyField3Action>( $action => $action.pipe(
            ofType( 'CHANGE_DUMMY_FIELD_2' ),
            map( action => ( { type: 'CHANGE_DUMMY_FIELD_3', payload: ( action as Action ).payload } ) ),
        ) )

        dummyStore.addObservers( [
            dummyObserver1,
            dummyObserver2
        ] )

        dummyStore.dispatch( { type: "CHANGE_DUMMY_FIELD_1", payload: 'Changed value' } )
        expect( dummyStore.getState().dummyField1 ).toBe( 'Changed value' )
        expect( dummyStore.getState().dummyField2 ).toBe( 'Changed value' )
        expect( dummyStore.getState().dummyField3 ).toBe( 'Changed value' )
    } )
} )