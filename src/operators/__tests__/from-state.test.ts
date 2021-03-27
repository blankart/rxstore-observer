import { createRxjsStore } from '#core'
import { reducer } from '#templates/mock-store'
import { map, mapTo } from 'rxjs/operators'
import fromState from '../from-state'

describe( 'fromState', () => {
    test( 'fromState should yield the current state value', () => {
        const dummyStore = createRxjsStore( reducer )

        dummyStore.addWatcher( 'CHANGE_DUMMY_FIELD_1', pipe => pipe(
            fromState( state => state.dummyField1 ),
            map( dummyField1 => ( {
                type: 'CHANGE_DUMMY_FIELD_2',
                payload: dummyField1
            } ) )
        ) )

        dummyStore.dispatch( { type: 'CHANGE_DUMMY_FIELD_1', payload: 'Changed value' } )
        expect( dummyStore.getState().dummyField1 ).toBe( 'Changed value' )
        expect( dummyStore.getState().dummyField2 ).toBe( 'Changed value' )

        dummyStore.dispatch( { type: 'CHANGE_DUMMY_FIELD_1', payload: 'Changed value again' } )

        dummyStore.addWatcher( 'CHANGE_DUMMY_FIELD_2', pipe => pipe(
            fromState( state => state.dummyField1 ),
            mapTo( { type: 'CHANGE_DUMMY_FIELD_3', payload: 'Changed from another watcher' } )
        ) )

        expect( dummyStore.getState().dummyField1 ).toBe( 'Changed value again' )
        expect( dummyStore.getState().dummyField2 ).toBe( 'Changed value again' )
        expect( dummyStore.getState().dummyField3 ).toBe( 'Changed from another watcher' )
    } )
} )