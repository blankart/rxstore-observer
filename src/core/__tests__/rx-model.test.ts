import ofType from '../of-type'
import { map, mapTo, mergeMap } from 'rxjs/operators'
import { ActionMethods, State as IState } from '../../templates/mock-store'
import { Injectable, RxModel, ActionMethod, ActionType, State, Effect } from '../rx-model'
import { Observable, of, Subject } from 'rxjs'
import { EffectFunction, RxModelActionOf, RxModelObservableActions } from 'src/types'
import createRxStore from '../create-rx-store'
import combineReducers from '../combine-reducers'

describe( 'Store', () => {
    test( 'Store initialization using Store', () => {
        class DummyStoreInstance {
            @State dummyField1 = ''
            @State dummyField2 = ''
            @State dummyField3 = ''

            @ActionMethod changeDummyField1( value: string ) { this.dummyField1 = value }
            @ActionMethod changeDummyField2( value: string ) { this.dummyField2 = value }
            @ActionMethod changeDummyField3( value: string ) { this.dummyField3 = value }
        }

        const { actions, reducer } = new RxModel<IState, ActionMethods>( DummyStoreInstance )
        const dummyStore = createRxStore( reducer )
        expect( dummyStore.getState() ).toEqual( { dummyField1: '', dummyField2: '', dummyField3: '' } )
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
    test( 'Store effects using Store', () => {
        class DummyStore1Instance {
            @State dummyField3 = ''

            @ActionType( 'changeDummyField3' ) changeDummyField3ActionType: RxModelActionOf<ActionMethods, 'changeDummyField3'>['type']
            @ActionMethod changeDummyField3( value: string ) { this.dummyField3 = value }
        }

        class DummyStoreInstance extends DummyStore1Instance {
            @State dummyField1 = ''
            @State dummyField2 = ''

            @ActionType( 'changeDummyField1' ) changeDummyField1ActionType: RxModelActionOf<ActionMethods, 'changeDummyField1'>['type']
            @ActionType( 'changeDummyField2' ) changeDummyField2ActionType: RxModelActionOf<ActionMethods, 'changeDummyField2'>['type']
            @ActionMethod changeDummyField1( value: string ) { this.dummyField1 = value }
            @ActionMethod changeDummyField2( value: string ) { this.dummyField2 = value }

            @Effect watchDummyField1( action$: Subject<RxModelObservableActions<ActionMethods>> ) {
                return action$.pipe( 
                    ofType<RxModelActionOf<ActionMethods, 'changeDummyField1'>>( this.changeDummyField1ActionType ),
                    map( action => this.changeDummyField2( ...action.payload ) )
                )
            }

            @Effect watchDummyField1_2( action$: Subject<RxModelObservableActions<ActionMethods>> ) {
                return action$.pipe(
                    ofType<RxModelActionOf<ActionMethods, 'changeDummyField1'>>( this.changeDummyField1ActionType ),
                    map( action => this.changeDummyField3( ...action.payload ) )
                )
            }
        }

        const { reducer, actions, effects, initialState } = new RxModel( DummyStoreInstance )
        const dummyStore = createRxStore( reducer, initialState, [ ...effects ] )
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

    test( 'Store subscription using Store', () => {
        class DummyStoreInstance {
            @State dummyField1 = ''
            @State dummyField2 = ''
            @State dummyField3 = ''

            @ActionMethod changeDummyField1( value: string ) { this.dummyField1 = value }
            @ActionMethod changeDummyField2( value: string ) { this.dummyField2 = value }
        }

        const { reducer, actions } = new RxModel<IState, ActionMethods>( DummyStoreInstance )
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
            dummyStore.dispatch( actions.changeDummyField1( `Count ${ i }` ) )
        }

        expect( mockFunction1 ).toBeCalledTimes( 8 )
        expect( count1 ).toBe( 8 )
        expect( mockFunction2 ).toBeCalledTimes( 18 )
        expect( count2 ).toBe( 18 )
        expect( dummyStore.getState().dummyField1 ).toBe( 'Count 20' )
    } )

    test( 'Injected models', () => {
        let store1Instance: any = {}
        let store2Instance: any = {}

        class NestedStore {
            @State fromNestedStore = true

            @ActionMethod changeNestedStoreToFalse() { this.fromNestedStore = false }
        }

        class AnotherNestedStore extends NestedStore {
            @State fromAnotherNestedStore = true

            @ActionMethod changeFromAnotherNestedStoreToFalse() { this.fromAnotherNestedStore = false }
        }

        @Injectable
        class Store1 {
            @State fromStore1 = 'fromStoreOne'
            @ActionType( 'anActionType' ) anActionType = 'anActionType'
            exposedMethodFromStore1(): void { return }
        }

        @Injectable
        class Store2 {
            exposedMethodFromStore2(): void { return }
        }

        @Injectable
        class Store3 extends AnotherNestedStore {
            @State anotherState = 'fromStore3'

            @ActionMethod accessFromStore1() {
                this.anotherState = 'Changed state'
                store1Instance = this.store1
                store2Instance = this.store2
            }

            constructor( 
                protected store1: Store1, 
                protected store2: Store2 
            ) { super() }
        }

        const { reducer, actions }  = new RxModel( Store3 )
        const store = createRxStore( reducer )
        expect( store.getState() ).toEqual( { anotherState: 'fromStore3', fromNestedStore: true, fromAnotherNestedStore: true } )
        store.dispatch( actions.accessFromStore1() )
        expect( store.getState() ).toEqual( { anotherState: 'Changed state', fromNestedStore: true, fromAnotherNestedStore: true } )
        store.dispatch( actions.changeFromAnotherNestedStoreToFalse() )
        store.dispatch( actions.changeNestedStoreToFalse() )
        expect( store.getState().fromNestedStore ).toEqual( false )
        expect( store.getState().fromAnotherNestedStore ).toEqual( false )
        expect( store1Instance.states ).toBeFalsy()
        expect( store1Instance.actionType ).toBeFalsy()
        expect( store1Instance.exposedMethodFromStore1 ).toBeTruthy()
        expect( store2Instance.exposedMethodFromStore2 ).toBeTruthy()
    } )

    test( 'Invalid action methods', () => {
        const Test = () => {
            ActionMethod( this, 'test', { value: async function() { return } } as any )
        }
        const Test2 = () => {
            ActionMethod( this, 'test', { value: async function() { throw new Error( 'Error' ) } } as any )
        }
        const Test3 = () => {
            ActionMethod( this, 'test', { value: function() { return new Promise( resolve => resolve( 'any' ) ) } } as any )
        }

        expect( Test ).toThrowError()
        expect( Test2 ).toThrowError()
        expect( Test3 ).toThrowError()
    } )

    test( 'Shared action types and dispatchers from multiple Store instances', () => {
        type IStore1_ = {
            changeStore1State: ( p: string ) => void
            changeAnotherStore1State: ( p: string ) => void
            changeAnotherStore1State2: ( p: string ) => void
        }
        type IStore2_ = {
            changeStore2State: ( p: string ) => void
        }

        interface IStore1State {
            store1State: string
            anotherStore1State: string
            anotherStore1State2: string
            shouldChangeFromStore2: string
        }

        interface IStore2State {
            store2State: string
        }

        @Injectable
        class Store1ActionsAndState implements IStore1_ {
            @State store1State = ''
            @State anotherStore1State = ''
            @State anotherStore1State2 = ''
            @State shouldChangeFromStore2 = ''

            @ActionType( 'changeStore1State' ) changeStore1StateType: RxModelActionOf<IStore1_, 'changeStore1State'>['type']
            @ActionMethod changeStore1State( p: string ) { this.store1State = p }

            @ActionType( 'changeAnotherStore1State' ) changeAnotherStore1StateType: RxModelActionOf<IStore1_, 'changeAnotherStore1State'>['type']
            @ActionMethod changeAnotherStore1State( p: string ) { this.anotherStore1State = p }

            @ActionType( 'changeAnotherStore1State2' ) changeAnotherStore2StateType: RxModelActionOf<IStore1_, 'changeAnotherStore1State2'>['type']
            @ActionMethod changeAnotherStore1State2( p: string ) { this.anotherStore1State2 = p } 
            @ActionMethod changeShouldChangeFromStore2( p: string ) { this.shouldChangeFromStore2 = p }

            @Effect changeTheStoreState2( action$: Observable<RxModelObservableActions<IStore1_>> ) {
                return action$.pipe(
                    ofType<RxModelActionOf<IStore1_, 'changeAnotherStore1State'>>( this.changeAnotherStore1StateType ),
                    mapTo( this.changeAnotherStore1State2( 'Final change' ) )
                )
            }
        }

        @Injectable
        class Store2ActionsAndState implements IStore2_ {
            @State store2State = ''

            @ActionType( 'changeStore2State' ) changeStore2StateType: RxModelActionOf<IStore2_, 'changeStore2State'>['type']
            @ActionMethod changeStore2State( p: string ) { this.store2State = p }
        }

        @Injectable
        class Store1_ extends Store1ActionsAndState {
            @State dumyState = ''
            @Effect store2Effect( action$: Observable<RxModelObservableActions<IStore2_>> ) {
                return action$.pipe(
                    ofType<RxModelActionOf<IStore2_, 'changeStore2State'>>( this.store2Actions.changeStore2StateType ),
                    map( action => this.changeAnotherStore1State( ...action.payload ) )
                )
            }

            @Effect anotherStore2Effect(  action$: Observable<RxModelObservableActions<IStore2_>> ) {
                return action$.pipe(
                    ofType<RxModelActionOf<IStore1_, 'changeAnotherStore1State2'>>( this.store1Actions.changeAnotherStore2StateType ),
                    mapTo( this.store1Actions.changeShouldChangeFromStore2( 'Final change' ) )
                )
            }

            constructor( 
                protected store2Actions: Store2ActionsAndState,
                protected store1Actions: Store1ActionsAndState 
            ) { super() }
        }

        @Injectable
        class Store2_ extends Store2ActionsAndState {
            @State dumyState = ''
            @Effect store1Effect( action$: Observable<RxModelObservableActions<IStore1_>> ) {
                return action$.pipe(
                    ofType<RxModelActionOf<IStore1_, 'changeStore1State'>>( this.store1Actions.changeStore1StateType ),
                    map( action => this.changeStore2State( ...action.payload ) )
                )
            }

            constructor( protected store1Actions: Store1ActionsAndState ) { super() }
        }

        const { reducer: store1, actions: storeActions1, effects: storeEffects1 } = new RxModel<IStore1State, IStore1_>( Store1_ )
        const { reducer: store2, effects: storeEffects2 } = new RxModel<IStore2State, IStore2_>( Store2_ )
        const effects: Array<EffectFunction<any, any>> = [ ...storeEffects1, ...storeEffects2 ]
        const store = createRxStore( combineReducers( { store1, store2 } ), undefined, effects )
        store.dispatch( storeActions1.changeStore1State( 'Changed value' ) )
        expect( store.getState().store1.store1State ).toBe( 'Changed value' )
        expect( store.getState().store2.store2State ).toBe( 'Changed value' )
        expect( store.getState().store1.anotherStore1State ).toBe( 'Changed value' )
        expect( store.getState().store1.anotherStore1State2 ).toBe( 'Final change' )
        expect( store.getState().store1.shouldChangeFromStore2 ).toBe( 'Final change' )
    }  )

    test( 'Test nested @Injectable', () => {
        const snapShots: any[] = []
        @Injectable
        class ClassInstance1 {
            accessThisMethod(): string { return 'Data accessed' }
        }

        @Injectable
        class ClassInstance2 {
            shouldChangeValue = ''
            accessClassInstance1Method() {
                this.shouldChangeValue = 'Changed value'
                return this.classInstance1.accessThisMethod()
            }
            constructor( protected classInstance1: ClassInstance1 ) {}
        }

        @Injectable
        class ClassInstance3 {
            shouldChangeValue = ''
            accessClassInstance2Method() {
                this.shouldChangeValue = 'Changed value'
                return this.classInstance2.accessClassInstance1Method()
            }
            constructor( protected classInstance2: ClassInstance2 ) {}
        }

        @Injectable
        class FinalInstance {
            @State dummyState = ''

            @ActionMethod setDummyState() {
                this.dummyState = this.classInstance3.accessClassInstance2Method()
                this.classInstance2.accessClassInstance1Method() 
                snapShots.push( this.classInstance3.shouldChangeValue )
                snapShots.push( this.classInstance2.shouldChangeValue )
            }

            constructor( protected classInstance3: ClassInstance3, protected classInstance2: ClassInstance2 ) {}
        }

        const { reducer, actions } = new RxModel( FinalInstance )
        const store = createRxStore( reducer )
        store.dispatch( actions.setDummyState() )
        expect( store.getState().dummyState ).toBe( 'Data accessed' )
        expect( snapShots ).toEqual( [ 'Changed value', 'Changed value' ] )
    } )

    test( 'Test Services', () => {
        @Injectable
        class SampleService {
            fetchServices$() { return of( 'Accessed' ) }
        }

        @Injectable
        class MainStore {
            @State sampleState = ''

            @ActionType( 'fetchFromService' ) fetchFromServiceType: string
            @ActionMethod fetchFromService() { return }
            @ActionMethod setSampleState( value: string ) { this.sampleState  = value }

            @Effect fetchFromServiceEffect( action$: Observable<any> ) {
                return action$.pipe(
                    ofType( this.fetchFromServiceType ),
                    mergeMap( () => this.sampleService.fetchServices$() ),
                    map( data => this.setSampleState( data ) )
                )
            }

            constructor(
                protected sampleService: SampleService
            ) { }
        }

        const { reducer, actions, effects, initialState } = new RxModel( MainStore )
        const store = createRxStore( reducer, initialState, effects )
        store.dispatch( actions.fetchFromService() )
        expect( store.getState().sampleState ).toBe( 'Accessed' )
    } )
} )