import { BehaviorSubject, Subject } from 'rxjs'
import { 
    RxStore, 
    ObserverFunction, 
    SubscribeFunction, 
    Action, 
    RxReducer,  
    RxStoreEnhancer,
    ObserverActionType,
    RxObserverOrObserverClass,
} from '../types'
import { __observerFactory } from '../internals/__observer-factory'
import isClass from '../utils/is-class'
import observerCreator from '../internals/observer-creator'

/**
 * Function for creating an RxJS Store.
 * 
 * @param {RxReducer<S, T>} rootReducer 
 * @param {S} initialState
 * 
 * @return {RxStore<S, T, SubscribeFunction, ObserverFunction>} generated store
 */
const createRxStore = <
    S extends Record<string, any>,
    T extends Action,
>(
    rootReducer: RxReducer<S, T>,
    initialState?: S,
    enhancer?: RxStoreEnhancer<S, T>
): RxStore<S, T> => {
    if ( typeof rootReducer !== 'function' || isClass( rootReducer ) ) {
        throw new Error( 'Invalid reducer parameter. Reducer must be of type `function`.' )
    }

    if ( enhancer && ( typeof enhancer !== 'function' || isClass( rootReducer ) ) ) {
        throw new Error( 'Invalid enhancer function. Enhancer must be of type `function`' )
    }

    /**
     * Allow enhancers to overwrite the existing creator function.
     */
    if ( enhancer ) {
        return enhancer( createRxStore )( rootReducer, initialState ) as RxStore<S, T>
    }

    /**
     * If no initial state is passed, it is already
     * assumed that the initial state is passed as
     * the default value of the reducer.
     */
    if ( ! initialState ) {
        initialState = rootReducer( ( undefined as unknown ) as S, {} as T )
    }

    /**
     * State handlers. This allows us to store all global states
     * into a single entity. Ideally, global state is of type object.
     * 
     * BehaviorSubject is used to subscribe to state changes. 
     */
    const $state = new BehaviorSubject<S>( initialState as S )
    const getState = () => $state.getValue() as S

    /**
     * Actions are objects which has a type and a payload.
     * This is passed inside the dispatch function that
     * changes the values inside the store.
     * 
     * BehaviorSubject is used to subscribe to action streams.
     * After every changes, the action is passed as the second argument
     * in the reducer function to change the current state.
     */
    const $action = new Subject<T>()
    $action.subscribe( {
        next: newAction => {
            const newState = rootReducer( getState(), newAction as T )
            $state.next( newState )
        }
    } )

    const subscribe = ( subscribeFunction: SubscribeFunction<T> ): () => void => {
        const subscription = $action.subscribe( { next: newAction => subscribeFunction( newAction as T ) } )
        return () => {
            subscription.unsubscribe()
        }
    }

    const addObserver = ( type: ObserverActionType<T>, observerFunction: ObserverFunction<S,T> ) => { 
        if ( typeof observerFunction === 'function' && ! isClass( observerFunction ) ) {
            observerCreator<S, T>( type, observerFunction, $action, getState, dispatch )
            return
        }
        throw new Error( `Invalid observer passed. Expected an observer function or class instance. But received: ${ observerFunction }` )
    }

    const addObservers = ( newObservers: Array<RxObserverOrObserverClass<S,T>> ) => {
        newObservers.forEach( observer => {
            if ( isClass( observer ) ) {
                /**
                 * All registered keys and methods from
                 * decorated class methods will be enqueued
                 * here.
                 * 
                 * It accesses the `__observerFactory` object and
                 * scans all observer functions that matches the class name
                 * passed inside the `addObservers`
                 * 
                 * The approach for registering an observer using decorators
                 * is still subject to change, as it imposes some weaknesses
                 * (e.g. users cannot reuse decorated classes as observers 
                 * to other store instances since __observerFactory only takes
                 * note of the class name. )
                 */
                const key = observer.name as unknown as keyof typeof __observerFactory 
                if ( __observerFactory.observers[ key ] ) {
                    __observerFactory.observers[ key ].forEach( ( { type, observerFunction } ) => {
                        observerCreator( type, observerFunction, $action, getState, dispatch )
                    } )
                    __observerFactory.observers[ key ] = []
                    return
                } 

                throw new Error( `${ key } is not a valid observer class. Make sure to provide a class with decorated methods (@MakeObserver).` )
            }

            if ( typeof observer === 'function' ) {
                observer( $action as BehaviorSubject<T>, getState, dispatch ) 
                return
            }

            if ( ! observer || typeof observer !== 'object' || ! observer.prototype.constructor ) {
                throw new Error( `Invalid observer passed. Expected an observer function or class instance. But received: ${ observer }` )
            }
        } )
    }

    const dispatch = ( newAction: T ) => {
        const next = ( val: T ): any => $action.next( val ) 
        /**
         * If provided next action is null or undefined,
         * don't dispatch anything.
         */
        if ( newAction === null || newAction === undefined ) {
            return
        }

        next( newAction )
    }

    return { getState, subscribe, dispatch, addObserver, addObservers } as RxStore<S, T>
}

export default createRxStore
