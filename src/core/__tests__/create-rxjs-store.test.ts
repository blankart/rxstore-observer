import createRxjsStore from '../create-rxjs-store'
import { map } from 'rxjs/operators'
import { Action, reducer, initialState } from '#templates/mock-store'

describe( 'createRxJsStore', () => {
    test( 'Store initialization', () => {
        const dummyStore = createRxjsStore( reducer )
        expect( dummyStore.getState ).toBeTruthy()
        expect( dummyStore.getState() ).toEqual( initialState )
        expect( dummyStore.addWatcher ).toBeTruthy()
        expect( dummyStore.subscribe ).toBeTruthy()
        expect( dummyStore.dispatch ).toBeTruthy()
    } )

    test( 'Store data manipulation', () => {
        const dummyStore = createRxjsStore( reducer )
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

    test( 'Store watchers', () => {
        const dummyStore = createRxjsStore( reducer )
        dummyStore.addWatcher( 'CHANGE_DUMMY_FIELD_1', pipe => pipe(
            map( ( value: Action ) => ( { type: 'CHANGE_DUMMY_FIELD_2', payload: value.payload } ) )
        ) )
        dummyStore.addWatcher( 'CHANGE_DUMMY_FIELD_1', pipe => pipe(
            map( ( value: Action ) => ( { type: 'CHANGE_DUMMY_FIELD_3', payload: value.payload } ) )
        ) )
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
        const dummyStore = createRxjsStore( reducer )
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