import createRxStore from '../create-rx-store'
import { map } from 'rxjs/operators'
import { Action, reducer, State } from '../../templates/mock-store'
import createObserver from '../create-observer'

describe( 'createObserver', () => {
    test( 'Register createObserver instance inside addObservers', () => {
        const dummyStore = createRxStore( reducer )

        const dummyObserver1 = createObserver<State, Action>( 'CHANGE_DUMMY_FIELD_1', $action => $action.pipe(
            map( action => ( { type: 'CHANGE_DUMMY_FIELD_2', payload: ( action as Action ).payload } ) )
        ) )

        const dummyObserver2 = createObserver<State, Action>( 'CHANGE_DUMMY_FIELD_2', $action => $action.pipe(
            map( action => ( { type: 'CHANGE_DUMMY_FIELD_3', payload: ( action as Action ).payload } ) )
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