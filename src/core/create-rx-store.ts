import { BehaviorSubject, merge, Observable, Subject } from 'rxjs'
import { 
    RxStore, 
    ObserverFunction , 
    SubscribeFunction , 
    Action, 
    RxReducer,  
    RxStoreEnhancer,
    ObserverActionType,
    RxObserverOrObserverClass,
} from '../types'
import createObserver from './create-observer'
import { __observerFactory, ObserverFactoryEntry } from './observer'
import isClass from '../utils/is-class'

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
    if ( typeof rootReducer !== 'function' ) {
        throw new Error( 'Invalid reducer parameter. Reducer must be of type `function`.' )
    }

    if ( enhancer && typeof enhancer !== 'function' ) {
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
        createObserver( type, observerFunction )( $action as BehaviorSubject<T>, getState, dispatch ).subscribe( {
            next: newAction => {
                /**
                         * If provided next action is null or undefined,
                         * don't dispatch anything.
                         */
                if ( newAction === null || newAction === undefined ) {
                    return
                }
                dispatch( newAction )
            }
        } )
    }

    const addObservers = ( newObservers: Array<RxObserverOrObserverClass<S,T>> ) => {
        const newObserversMap: Array<Observable<T>> = []
        newObservers.forEach( observer => {
            if ( isClass( observer ) ) {
                const key = observer.name as unknown as keyof typeof __observerFactory 

                if ( __observerFactory.observers[ key ] ) {

                    ( __observerFactory.observers[ key ] as unknown as Array<ObserverFactoryEntry<S, T>> ).forEach( ( { type, observerFunction } ) => {
                        newObserversMap.push(
                            createObserver( type, observerFunction )( $action, getState, dispatch )
                        )
                    } )
                } else {
                    throw new Error( `${ key } is not a valid observer class. Make sure to provide a class with decorated methods (@MakeObserver).` )
                }
                return
            }

            if ( typeof observer === 'function' ) {
                newObserversMap.push( observer( $action as BehaviorSubject<T>, getState, dispatch )  ) 
                return
            }

            if ( ! observer || typeof observer !== 'object' || ! observer.prototype.constructor ) {
                throw new Error( `Invalid observer passed. Expected an observer function or class instance. But received: ${ observer }` )
            }
        } )

        merge( ...newObserversMap ).subscribe( {
            next: newAction => {
                /**
                         * If provided next action is null or undefined,
                         * don't dispatch anything.
                         */
                if ( newAction === null || newAction === undefined ) {
                    return
                }
                dispatch( newAction )
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
