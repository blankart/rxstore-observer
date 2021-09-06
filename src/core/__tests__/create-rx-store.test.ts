import createRxStore from '../create-rx-store'
import ofType from '../of-type'
import { map } from 'rxjs/operators'
import { Action, reducer, initialState, ChangeDummyField3Action, ChangeDummyField2Action, State } from '../../templates/mock-store'
import { EffectFunction } from 'src/types'

describe( 'createRxJsStore', () => {
    test( 'Store initialization', () => {
        const dummyStore = createRxStore( reducer )
        expect( dummyStore.getState ).toBeTruthy()
        expect( dummyStore.getState() ).toEqual( initialState )
        expect( dummyStore.subscribe ).toBeTruthy()
        expect( dummyStore.dispatch ).toBeTruthy()
    } )

    test( 'Invalid reducer passed', () => {
        const invalidReducers = [ null, undefined, 'string', 23, class {} ]
        invalidReducers.forEach( invalidReducer => {
            const tryMockFunction = jest.fn()
            const catchMockFunction = jest.fn()
            try {
                createRxStore( invalidReducer as any )
                tryMockFunction()
            } catch ( e ) {
                catchMockFunction()
            }

            expect( tryMockFunction ).not.toBeCalled()
            expect( catchMockFunction ).toBeCalled()
        } )
    } )

    test( 'Invalid enhancer passed', () => {
        const invalidEnhancers = [ 'string', 23, class {} ]
        invalidEnhancers.forEach( invalidEnhancer => {
            const tryMockFunction = jest.fn()
            const catchMockFunction = jest.fn()
            try {
                createRxStore( reducer, undefined, undefined, invalidEnhancer as any )
                tryMockFunction()
            } catch ( e ) {
                catchMockFunction()
            }

            expect( tryMockFunction ).not.toBeCalled()
            expect( catchMockFunction ).toBeCalled()
        } )
    } )

    test( 'Store data manipulation', () => {
        const dummyStore = createRxStore( reducer )
        expect( dummyStore.getState() ).toEqual( initialState )
        dummyStore.dispatch( { type: 'CHANGE_DUMMY_FIELD_1', payload: 'Changed value' } )
        expect( dummyStore.getState().dummyField1 ).toBe( 'Changed value' )
        dummyStore.dispatch( { type: 'CHANGE_DUMMY_FIELD_1', payload: 'Changed value 2' } )
        expect( dummyStore.getState().dummyField1 ).toBe( 'Changed value 2' )
        dummyStore.dispatch( { type: 'CHANGE_DUMMY_FIELD_2', payload: 'Changed value' } )
        expect( dummyStore.getState().dummyField2 ).toBe( 'Changed value' )
        dummyStore.dispatch( { type: 'CHANGE_DUMMY_FIELD_2', payload: 'Changed value 2' } )
        expect( dummyStore.getState().dummyField2 ).toBe( 'Changed value 2' )
        dummyStore.dispatch( { type: 'CHANGE_DUMMY_FIELD_3', payload: 'Changed value' } )
        expect( dummyStore.getState().dummyField3 ).toBe( 'Changed value' )
        dummyStore.dispatch( { type: 'CHANGE_DUMMY_FIELD_3', payload: 'Changed value 2' } )
        expect( dummyStore.getState().dummyField3 ).toBe( 'Changed value 2' )
    } )

    test( 'Store effects', () => {
        const effect1: EffectFunction<State, Action, ChangeDummyField2Action> = action$ => action$.pipe(
            ofType( 'CHANGE_DUMMY_FIELD_1' ),
            map( value => ( { type: 'CHANGE_DUMMY_FIELD_2', payload: ( value as Action ).payload } ) )
        ) 

        const effect2: EffectFunction<State, Action, ChangeDummyField3Action> = action$ => { 
            return action$.pipe(
                ofType( 'CHANGE_DUMMY_FIELD_1' ),
                map( action => { 
                    return { type: 'CHANGE_DUMMY_FIELD_3', payload: ( action as Action ).payload }  
                } )
            )
        } 

        const dummyStore = createRxStore( reducer, undefined, [ effect1, effect2 ] )

        dummyStore.dispatch( { type: 'CHANGE_DUMMY_FIELD_1', payload: 'Changed value' } )
        expect( dummyStore.getState() ).toEqual( {
            dummyField1: 'Changed value',
            dummyField2: 'Changed value',
            dummyField3: 'Changed value',
        } )
        dummyStore.dispatch( { type: 'CHANGE_DUMMY_FIELD_2', payload: 'Changed value 2' } )
        expect( dummyStore.getState().dummyField2 ).toEqual( 'Changed value 2' )
        expect( dummyStore.getState().dummyField1 ).toEqual( 'Changed value' )
        expect( dummyStore.getState().dummyField3 ).toEqual( 'Changed value' )
        dummyStore.dispatch( { type: 'CHANGE_DUMMY_FIELD_1', payload: 'Should change the others too' } )
        expect( dummyStore.getState() ).toEqual( {
            dummyField1: 'Should change the others too',
            dummyField2: 'Should change the others too',
            dummyField3: 'Should change the others too',
        } )
    } )

    test( 'Store subscription', () => {
        const dummyStore = createRxStore( reducer )
        const mockFunction1 = jest.fn()
        const mockFunction2 = jest.fn()
        let count1 = 0
        let count2 = 0
        const unsubscribe1 = dummyStore.subscribe( () => {
            count1 ++
            mockFunction1()
            if ( count1 === 8 ) {
                unsubscribe1()
            }
        } )

        const unsubscribe2 = dummyStore.subscribe( () => {
            count2 ++
            mockFunction2()
            if ( count2 === 18 ) {
                unsubscribe2()
            }
        } )

        for ( let i = 0; i <= 20; i ++ ) {
            dummyStore.dispatch( { type: "CHANGE_DUMMY_FIELD_1", payload: `Count ${ i }` } )
        }

        expect( mockFunction1 ).toBeCalledTimes( 8 )
        expect( count1 ).toBe( 8 )
        expect( mockFunction2 ).toBeCalledTimes( 18 )
        expect( count2 ).toBe( 18 )
        expect( dummyStore.getState().dummyField1 ).toBe( 'Count 20' )
    } )
} )