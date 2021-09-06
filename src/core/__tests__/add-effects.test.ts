import createRxStore from '../create-rx-store'
import { map, tap, withLatestFrom } from 'rxjs/operators'
import { Action, reducer, State, ChangeDummyField2Action, ChangeDummyField3Action, ChangeDummyField1Action } from '../../templates/mock-store'
import ofType from '../of-type'
import { EffectFunction } from 'src/types'

describe( 'createEffect', () => {
    test( 'Register function instances inside addEffects', () => {
        const dummyEffect1: EffectFunction<State, Action, ChangeDummyField2Action> = action$ => action$.pipe(
            ofType( 'CHANGE_DUMMY_FIELD_1' ),
            map( action => ( { type: 'CHANGE_DUMMY_FIELD_2', payload: ( action as Action ).payload } ) )
        )

        const dummyEffect2: EffectFunction<State, Action, ChangeDummyField3Action> = action$ => action$.pipe(
            ofType( 'CHANGE_DUMMY_FIELD_2' ),
            map( action => ( { type: 'CHANGE_DUMMY_FIELD_3', payload: ( action as Action ).payload } ) ),
        )

        const dummyStore = createRxStore( reducer, undefined, [ dummyEffect1, dummyEffect2 ] )

        dummyStore.dispatch( { type: "CHANGE_DUMMY_FIELD_1", payload: 'Changed value' } )
        expect( dummyStore.getState().dummyField1 ).toBe( 'Changed value' )
        expect( dummyStore.getState().dummyField2 ).toBe( 'Changed value' )
        expect( dummyStore.getState().dummyField3 ).toBe( 'Changed value' )
    } )

    test( 'Calling action$.next() should trigger another dispatch', () => {
        const dummyEffect1: EffectFunction<State, Action, ChangeDummyField3Action> = action$ => action$.pipe(
            ofType( 'CHANGE_DUMMY_FIELD_1' ),
            map( action => ( { type: 'CHANGE_DUMMY_FIELD_3', payload: ( action as Action ).payload } ) )
        )

        const dummyEffect2: EffectFunction<State, Action, ChangeDummyField2Action> = action$ => action$.pipe(
            ofType( 'CHANGE_DUMMY_FIELD_1' ),
            map( action => ( { type: 'CHANGE_DUMMY_FIELD_2', payload: ( action as Action ).payload } ) ),
        )

        const dummyStore = createRxStore( reducer, undefined, [ dummyEffect1, dummyEffect2 ] )

        dummyStore.dispatch( { type: "CHANGE_DUMMY_FIELD_1", payload: 'Changed value' } )
        expect( dummyStore.getState().dummyField1 ).toBe( 'Changed value' )
        expect( dummyStore.getState().dummyField2 ).toBe( 'Changed value' )
        expect( dummyStore.getState().dummyField3 ).toBe( 'Changed value' )
    } )

    test( 'Gets the current store value', () => {
        const stubbedState: Array<State> = []
        const dummyEffect1: EffectFunction<State, Action, ChangeDummyField3Action> = ( action$, state$ ) => action$.pipe(
            ofType<ChangeDummyField1Action>( 'CHANGE_DUMMY_FIELD_1' ),
            withLatestFrom( state$ ),
            tap( ( [ , state ] ) => stubbedState.push( state ) ),
            map( ( [ action ] ) => ( { type: 'CHANGE_DUMMY_FIELD_3', payload: ( action as Action ).payload } ) )
        )

        const dummyStore = createRxStore( reducer, undefined, [ dummyEffect1 ] )

        dummyStore.dispatch( { type: "CHANGE_DUMMY_FIELD_1", payload: 'Changed value' } )
        expect( dummyStore.getState().dummyField1 ).toBe( 'Changed value' )
        expect( dummyStore.getState().dummyField3 ).toBe( 'Changed value' )
        expect( stubbedState[ 0 ] ).toEqual( { dummyField1: 'Changed value', dummyField2: '', dummyField3: '' } )
    } )
} )