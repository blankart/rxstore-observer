import { initialState, reducer, State, Action } from '#templates/mock-store'
import { RxjsStoreMiddleware } from '#types'
import applyMiddleware from '../apply-middleware'
import createRxjsStore from '../create-rxjs-store'

describe( 'applyMiddleware', () => {
    test( 'Registered middleware should be called', () => {
        const mockFunction1 = jest.fn()
        const mockFunction2 = jest.fn()
        const mockFunction3 = jest.fn()
        const mockMiddleware1: RxjsStoreMiddleware = () => next => action => {
            mockFunction1()
            if ( action.payload === `Changed 18 time(s)` ) {
                next( { type: 'CHANGE_DUMMY_FIELD_2', payload: 'Changed value' } )
            }
            next( action )
        }

        const mockMiddleware2: RxjsStoreMiddleware = () => next => action => {
            mockFunction2()
            next( action )
        }

        const mockMiddleware3: RxjsStoreMiddleware = () => next => action => {
            mockFunction3()
            next( action )
        }

        const dummyStore = createRxjsStore( reducer, initialState, applyMiddleware<State, Action>( mockMiddleware1, mockMiddleware2, mockMiddleware3 ) )

        for ( let i = 1; i <= 20; i ++ ) {
            dummyStore.dispatch( { type: "CHANGE_DUMMY_FIELD_1", payload: `Changed ${ i } time(s)` } )
            expect( dummyStore.getState().dummyField1 ).toBe( `Changed ${ i } time(s)` )
            if ( i === 18 ) {
                expect( dummyStore.getState().dummyField2 ).toBe( 'Changed value' )
            }
        }

        expect( mockFunction1 ).toBeCalledTimes( 20 )
        expect( mockFunction2 ).toBeCalledTimes( 21 )
        expect( mockFunction3 ).toBeCalledTimes( 21 )
    } )
} )