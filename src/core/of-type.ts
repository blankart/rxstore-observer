import { MonoTypeOperatorFunction } from 'rxjs'
import { filter } from 'rxjs/operators'
import { Action } from '../types'

/**
 * RxJS operator for filtering the 
 * action type from the RxStore action
 * stream.
 * 
 * @example
 * ```
 * const observer = createObserver( $action => $action.pipe(
 *  ofType( 'PING' ),
 *  mapTo( 'PONG' )
 * ))
 * 
 * store.addObservers( [ observer ] )
 * ```
 * 
 * @param {[ T, ...T[] ]} types 
 * @return {MonoTypeOperatorFunction<A>}
 */
const ofType = <
    A extends Action, 
    T = A['type'], 
>( ...types: [ T, ...T[] ] ) => filter<A>( $action => types.includes( $action.type ) )

export default ofType