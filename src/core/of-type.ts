import { OperatorFunction } from 'rxjs'
import { filter } from 'rxjs/operators'
import { Action } from '../types'

/**
 * RxJS operator for filtering the 
 * action type from the RxStore action
 * stream.
 * 
 * @example
 * ```
 * const effect = action$ => action$.pipe(
 *  ofType( 'PING' ),
 *  mapTo( 'PONG' )
 * )
 * 
 * store.addEffects( [ effect ] )
 * ```
 * 
 * @param {[ T, ...T[] ]} types 
 * @return {OperatorFunction<A>}
 */
const ofType = <
    A extends Action, 
    _A extends Action = Action,
    T = A['type'], 
>( ...types: [ T, ...T[] ] ): OperatorFunction<_A, A> => filter<A>( action$ => types.includes( action$.type ) ) as unknown as OperatorFunction<_A, A>

export default ofType