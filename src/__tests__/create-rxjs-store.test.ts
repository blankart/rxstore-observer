import createRxjsStore from '../create-rxjs-store'
import { map } from 'rxjs/operators'

interface State {
    dummyField1: string,
    dummyField2: string,
    dummyField3: string
}

const initialState: State = {
    dummyField1: '',
    dummyField2: '',
    dummyField3: '',
}

type Types = "CHANGE_DUMMY_FIELD_1" | "CHANGE_DUMMY_FIELD_2" | "CHANGE_DUMMY_FIELD_3"

interface Action {
    type: Types,
    payload: string
}

const reducer = ( state: State = initialState, action: Action ) => {
    switch ( action.type ) {
    case "CHANGE_DUMMY_FIELD_1": {
        return {
            ...state,
            dummyField1: action.payload
        }
    }
    case "CHANGE_DUMMY_FIELD_2": {
        return {
            ...state,
            dummyField2: action.payload
        }
    }
    case "CHANGE_DUMMY_FIELD_3": {
        return {
            ...state,
            dummyField3: action.payload
        }
    }
    default: return state
    }
}

describe( 'createRxJsStore', () => {
    test( 'Store initialization', () => {
        const dummyStore = createRxjsStore( reducer )
        expect( dummyStore.getState ).toBeTruthy()
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
} )