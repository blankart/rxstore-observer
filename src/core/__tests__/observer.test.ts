import Observer from '../observer'
import { map, mapTo, tap } from 'rxjs/operators'
import { Action, State, reducer } from '../../templates/mock-store'
import createRxStore from '../create-rx-store'
import { Observable } from 'rxjs'

describe( 'MakeObserver', () => {
    test( 'Using MakeObserver for creating side effects', () => {
        const mockFunction1 = jest.fn()
        const mockFunction2 = jest.fn()
        const mockFunction3 = jest.fn()
        class DummyStoreObserver1 {
            @Observer<State, Action>( 'CHANGE_DUMMY_FIELD_1' )
            handleSideEffect( $action: Observable<Action> ) {
                mockFunction1()
                return $action.pipe(
                    map( ( action: Action ) => ( { type: "CHANGE_DUMMY_FIELD_2", payload: action.payload } ) as Action )
                )
            }
        }

        class DummyStoreObserver2 {
            @Observer<State, Action>( 'CHANGE_DUMMY_FIELD_2' )
            handleSideEffect( $action: Observable<Action> ) {
                mockFunction2()
                return $action.pipe(
                    map( ( action: Action ) => ( { type: "CHANGE_DUMMY_FIELD_3", payload: action.payload } ) as Action )
                )
            }

            @Observer<State, Action>()
            handleSideEffect2( $action: Observable<Action> ) {
                return $action.pipe(
                    tap( () => mockFunction3() ),
                    mapTo( undefined )
                ) as unknown as Observable<Action>
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
        expect( mockFunction3 ).toBeCalledTimes( 3 )
    } )
} )