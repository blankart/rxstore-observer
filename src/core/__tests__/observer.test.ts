import Observer from '../observer'
import { map, mapTo, tap } from 'rxjs/operators'
import { Action, State, reducer } from '../../templates/mock-store'
import createRxStore from '../create-rx-store'
import { Observable } from 'rxjs'
import ofType from '../of-type'

describe( 'MakeObserver', () => {
    test( 'Using MakeObserver for creating side effects', () => {
        const mockFunction1 = jest.fn()
        const mockFunction2 = jest.fn()
        class DummyStoreObserver1 {
            @Observer<State, Action>()
            handleSideEffect( $action: Observable<Action> ) {
                mockFunction1()
                return $action.pipe(
                    ofType( 'CHANGE_DUMMY_FIELD_1' ),
                    map( action => ( { type: "CHANGE_DUMMY_FIELD_2", payload: action.payload } ) )
                )
            }
        }

        class DummyStoreObserver2 {
            @Observer<State, Action>()
            handleSideEffect( $action: Observable<Action> ) {
                mockFunction2()
                return $action.pipe(
                    ofType( 'CHANGE_DUMMY_FIELD_2' ),
                    map( action => ( { type: "CHANGE_DUMMY_FIELD_3", payload: action.payload } ) )
                )
            }
        }
        const dummyStore = createRxStore( reducer )
        dummyStore.addObservers( [ DummyStoreObserver1, DummyStoreObserver2 ] )
        dummyStore.dispatch( { type: "CHANGE_DUMMY_FIELD_1", payload: "Changed value" } )
        expect( dummyStore.getState().dummyField1 ).toBe( 'Changed value' )
        expect( dummyStore.getState().dummyField2 ).toBe( 'Changed value' )
        expect( dummyStore.getState().dummyField3 ).toBe( 'Changed value' )
        expect( mockFunction1 ).toBeCalledTimes( 1 )
        expect( mockFunction2 ).toBeCalledTimes( 1 )
    } )
} )