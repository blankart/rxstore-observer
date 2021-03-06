import { initialState, reducer, State, Action, ChangeDummyField3Action, ChangeDummyField1Action } from '../../templates/mock-store'
import { EffectFunction, RxStoreMiddleware } from '../../types'
import applyMiddleware from '../apply-middleware'
import createRxStore from '../create-rx-store'
import ofType from '../of-type'
import { mapTo } from 'rxjs/operators'

describe( 'applyMiddleware', () => {
    test( 'Registered middleware should be called', () => {
        const mockFunction1 = jest.fn()
        const mockFunction2 = jest.fn()
        const mockFunction3 = jest.fn()
        const mockFunction4 = jest.fn()
        // const logger = createLogger()
        const mockMiddleware1: RxStoreMiddleware = () => next => action => {
            mockFunction1()
            if ( action.payload === `Changed 18 time(s)` ) {
                next( { type: 'CHANGE_DUMMY_FIELD_2', payload: 'Changed value' } )
            }
            if ( action.type === 'CHANGE_DUMMY_FIELD_3' ) {
                mockFunction4()
            }

            next( action )
        }

        const mockMiddleware2: RxStoreMiddleware = () => next => action => {
            mockFunction2()
            next( action )
        }

        const mockMiddleware3: RxStoreMiddleware = () => next => action => {
            mockFunction3()
            next( action )
        }

        const effect: EffectFunction<State, Action, ChangeDummyField3Action> = action$ => action$.pipe(
            ofType<ChangeDummyField1Action>( 'CHANGE_DUMMY_FIELD_1' ),
            mapTo( { type: 'CHANGE_DUMMY_FIELD_3', payload: 'Changed' } )
        )

        const dummyStore = createRxStore( reducer, initialState, [ effect ], applyMiddleware<State, Action>( mockMiddleware1, mockMiddleware2, mockMiddleware3 ) )

        for ( let i = 1; i <= 20; i ++ ) {
            dummyStore.dispatch( { type: "CHANGE_DUMMY_FIELD_1", payload: `Changed ${ i } time(s)` } )
            expect( dummyStore.getState().dummyField1 ).toBe( `Changed ${ i } time(s)` )
            if ( i === 18 ) {
                expect( dummyStore.getState().dummyField2 ).toBe( 'Changed value' )
            }
        }

        expect( mockFunction1 ).toBeCalledTimes( 40 )
        expect( mockFunction2 ).toBeCalledTimes( 41 )
        expect( mockFunction3 ).toBeCalledTimes( 41 )
        // Side effects should also be pumped inside middlewares.
        expect( mockFunction4 ).toBeCalledTimes( 20 )
    } )

    test( 'Test middlewares', () => {
        const mockFunction = jest.fn()
        const simpleThunkMiddleware: RxStoreMiddleware = store => next => ( action: any ) => {
            if ( typeof action === 'function' ) {
                return action( store.dispatch )
            }
            return next( action )
        } 

        const anotherMiddleware: RxStoreMiddleware = () => next => ( action: any ) => {
            mockFunction()
            next( action )
        }

        const dummyStore = createRxStore( reducer, initialState, undefined, applyMiddleware<State, Action>( simpleThunkMiddleware, anotherMiddleware ) )

        dummyStore.dispatch( ( ( dispatch: ( ...args: any ) => any ) => {
            dispatch( { type: 'CHANGE_DUMMY_FIELD_1', payload: 'Changed value 1' } ) 
            dispatch( { type: 'CHANGE_DUMMY_FIELD_2', payload: 'Changed value 2' } ) 
            dispatch( { type: 'CHANGE_DUMMY_FIELD_3', payload: 'Changed value 3' } ) 
        } ) as unknown as Action )
        expect( dummyStore.getState().dummyField1 ).toBe( 'Changed value 1' )
        expect( dummyStore.getState().dummyField2 ).toBe( 'Changed value 2' )
        expect( dummyStore.getState().dummyField3 ).toBe( 'Changed value 3' )
        expect( mockFunction ).toBeCalledTimes( 3 )
    } )

    test( 'Middleware errors', () => {
        const mockMiddleware: RxStoreMiddleware = store => {
            store.dispatch( { type: "DISPATCHED AN ACTION WHILE CREATING THE MIDDLEWARE" } )
            return next => ( action: any ) => {
                next( action )
            }
        }

        const tryMockFunction = jest.fn()
        const catchMockFunction = jest.fn()

        try {
            createRxStore( reducer, initialState, undefined, applyMiddleware<State, Action>( mockMiddleware ) )  
            tryMockFunction()
        } catch ( e ) {
            catchMockFunction()
        }

        expect( tryMockFunction ).not.toBeCalled()
        expect( catchMockFunction ).toBeCalled()
    } )
} )