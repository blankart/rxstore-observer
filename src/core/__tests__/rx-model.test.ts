import createRxStore from '../create-rx-store'
import ofType from '../of-type'
import { map } from 'rxjs/operators'
import { ActionMethods, State as IState } from '../../templates/mock-store'
import { RxModel, ActionMethod, ActionType, createModel, State, Observer } from '../rx-model'
import { Subject } from 'rxjs'
import { RxModelActionOf, RxModelObservableActions } from 'src/types'

describe( 'RxModel', () => {
    test( 'Store initialization using RxModel', () => {
        @RxModel
        class DummyStoreInstance {
            @State dummyField1 = ''
            @State dummyField2 = ''
            @State dummyField3 = ''

            @ActionMethod
            changeDummyField1( value: string ) {
                this.dummyField1 = value
            }

            @ActionMethod
            changeDummyField2( value: string ) {
                this.dummyField2 = value
            }

            @ActionMethod
            changeDummyField3( value: string ) {
                this.dummyField3 = value
            }
        }

        const { reducer, actions, initialState } = createModel<IState, ActionMethods>( DummyStoreInstance )
        const dummyStore = createRxStore( reducer, initialState )
        expect( dummyStore.getState() ).toEqual( initialState )
        dummyStore.dispatch( actions.changeDummyField1( 'Changed value' ) )
        expect( dummyStore.getState().dummyField1 ).toBe( 'Changed value' )
        dummyStore.dispatch( actions.changeDummyField1( 'Changed value 2' ) )
        expect( dummyStore.getState().dummyField1 ).toBe( 'Changed value 2' )
        dummyStore.dispatch( actions.changeDummyField2( 'Changed value' ) )
        expect( dummyStore.getState().dummyField2 ).toBe( 'Changed value' )
        dummyStore.dispatch( actions.changeDummyField2( 'Changed value 2' ) )
        expect( dummyStore.getState().dummyField2 ).toBe( 'Changed value 2' )
        dummyStore.dispatch( actions.changeDummyField3( 'Changed value' ) )
        expect( dummyStore.getState().dummyField3 ).toBe( 'Changed value' )
        dummyStore.dispatch( actions.changeDummyField3( 'Changed value 2' ) )
        expect( dummyStore.getState().dummyField3 ).toBe( 'Changed value 2' )
    } )
    test( 'Store observers using RxModel', () => {
        class DummyStore1Instance {
            @State dummyField3 = ''

            @ActionType( 'changeDummyField3' )
            changeDummyField3ActionType: RxModelActionOf<ActionMethods, 'changeDummyField3'>['type']
            @ActionMethod
            changeDummyField3( value: string ) {
                this.dummyField3 = value
            }
        }

        @RxModel
        class DummyStoreInstance extends DummyStore1Instance {
            @State dummyField1 = ''
            @State dummyField2 = ''

            @ActionType( 'changeDummyField1' )
            changeDummyField1ActionType: RxModelActionOf<ActionMethods, 'changeDummyField1'>['type']
            @ActionMethod
            changeDummyField1( value: string ) {
                this.dummyField1 = value
            }

            @ActionType( 'changeDummyField2' )
            changeDummyField2ActionType: RxModelActionOf<ActionMethods, 'changeDummyField2'>['type']
            @ActionMethod
            changeDummyField2( value: string ) {
                this.dummyField2 = value
            }

            @Observer
            watchDummyField1( action$: Subject<RxModelObservableActions<ActionMethods>> ) {
                return action$.pipe(
                    ofType<RxModelActionOf<ActionMethods, 'changeDummyField1'>>( this.changeDummyField1ActionType ),
                    map( action => this.changeDummyField2( action.payload ) )
                )
            }

            @Observer
            watchDummyField1_2( action$: Subject<RxModelObservableActions<ActionMethods>> ) {
                return action$.pipe(
                    ofType<RxModelActionOf<ActionMethods, 'changeDummyField1'>>( this.changeDummyField1ActionType ),
                    map( action => this.changeDummyField3( action.payload ) )
                )
            }
        }

        const { reducer, initialState, actions, observers } = createModel<IState, ActionMethods>( DummyStoreInstance )
        const dummyStore = createRxStore( reducer, initialState )
        dummyStore.addObservers( observers )

        dummyStore.dispatch( actions.changeDummyField1( 'Changed value' ) )
        expect( dummyStore.getState() ).toEqual( {
            dummyField1: 'Changed value',
            dummyField2: 'Changed value',
            dummyField3: 'Changed value',
        } )
        dummyStore.dispatch( actions.changeDummyField2( 'Changed value 2' ) )
        expect( dummyStore.getState().dummyField2 ).toEqual( 'Changed value 2' )
        expect( dummyStore.getState().dummyField1 ).toEqual( 'Changed value' )
        expect( dummyStore.getState().dummyField3 ).toEqual( 'Changed value' )
        dummyStore.dispatch( actions.changeDummyField1( 'Should change the others too' ) )
        expect( dummyStore.getState() ).toEqual( {
            dummyField1: 'Should change the others too',
            dummyField2: 'Should change the others too',
            dummyField3: 'Should change the others too',
        } )
    } )

    test( 'Store subscription using RxModel', () => {
        @RxModel
        class DummyStoreInstance {
            @State dummyField1 = ''
            @State dummyField2 = ''
            @State dummyField3 = ''

            @ActionMethod
            changeDummyField1( value: string ) {
                this.dummyField1 = value
            }

            @ActionMethod
            changeDummyField2( value: string ) {
                this.dummyField2 = value
            }
        }

        const { reducer, actions, initialState } = createModel<IState, ActionMethods>( DummyStoreInstance )
        const dummyStore = createRxStore( reducer, initialState )
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
            dummyStore.dispatch( actions.changeDummyField1( `Count ${ i }` ) )
        }

        expect( mockFunction1 ).toBeCalledTimes( 8 )
        expect( count1 ).toBe( 8 )
        expect( mockFunction2 ).toBeCalledTimes( 18 )
        expect( count2 ).toBe( 18 )
        expect( dummyStore.getState().dummyField1 ).toBe( 'Count 20' )
    } )
} )