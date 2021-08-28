import createRxStore from '../create-rx-store'
import { map, tap } from 'rxjs/operators'
import { Action, reducer, State, ChangeDummyField2Action, ChangeDummyField3Action, ChangeDummyField1Action } from '../../templates/mock-store'
import createObserver from '../create-observer'
import ofType from '../of-type'

describe( 'createObserver', () => {
    test( 'Register createObserver instance inside addObservers', () => {
        const dummyStore = createRxStore( reducer )

        const dummyObserver1 = createObserver<State, Action, ChangeDummyField2Action>( action$ => action$.pipe(
            ofType( 'CHANGE_DUMMY_FIELD_1' ),
            map( action => ( { type: 'CHANGE_DUMMY_FIELD_2', payload: ( action as Action ).payload } ) )
        ) )

        const dummyObserver2 = createObserver<State, Action, ChangeDummyField3Action>( action$ => action$.pipe(
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

    test( 'Calling action$.next() should trigger another dispatch', () => {
        const dummyStore = createRxStore( reducer )

        const dummyObserver1 = createObserver<State, Action, ChangeDummyField3Action>( action$ => action$.pipe(
            ofType( 'CHANGE_DUMMY_FIELD_1' ),
            tap( action => action$.next( { type: 'CHANGE_DUMMY_FIELD_2', payload: ( action as Action ).payload } ) ),
            map( action => ( { type: 'CHANGE_DUMMY_FIELD_3', payload: ( action as Action ).payload } ) )
        ) )

        dummyStore.addObservers( [
            dummyObserver1,
        ] )

        dummyStore.dispatch( { type: "CHANGE_DUMMY_FIELD_1", payload: 'Changed value' } )
        expect( dummyStore.getState().dummyField1 ).toBe( 'Changed value' )
        expect( dummyStore.getState().dummyField2 ).toBe( 'Changed value' )
        expect( dummyStore.getState().dummyField3 ).toBe( 'Changed value' )
    } )

    test( 'Gets the current store value', () => {
        const dummyStore = createRxStore( reducer )
        const stubbedState: Array<State> = []

        const dummyObserver1 = createObserver<State, Action, ChangeDummyField3Action>( ( action$, state$ ) => action$.pipe(
            ofType<ChangeDummyField1Action>( 'CHANGE_DUMMY_FIELD_1' ),
            tap( () => stubbedState.push( state$.value ) ),
            tap( action => action$.next( { type: 'CHANGE_DUMMY_FIELD_2', payload: ( action as Action ).payload } ) ),
            tap( () => stubbedState.push( state$.value ) ), 
            map( action => ( { type: 'CHANGE_DUMMY_FIELD_3', payload: ( action as Action ).payload } ) )
        ) )

        dummyStore.addObservers( [
            dummyObserver1,
        ] )

        dummyStore.dispatch( { type: "CHANGE_DUMMY_FIELD_1", payload: 'Changed value' } )
        expect( dummyStore.getState().dummyField1 ).toBe( 'Changed value' )
        expect( dummyStore.getState().dummyField2 ).toBe( 'Changed value' )
        expect( dummyStore.getState().dummyField3 ).toBe( 'Changed value' )
        expect( stubbedState[ 0 ] ).toEqual( { dummyField1: 'Changed value', dummyField2: '', dummyField3: '' } )
        expect( stubbedState[ 1 ] ).toEqual( { dummyField1: 'Changed value', dummyField2: 'Changed value', dummyField3: '' } )
        expect( dummyStore.getState() ).toEqual( { dummyField1: 'Changed value', dummyField2: 'Changed value', dummyField3: 'Changed value' } )
    } )
} )