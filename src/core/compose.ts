/**
 * A utility function for combining multiple
 * functions with one argument.
 * 
 * It can be used for combining multiple
 * store enhancers into a one function.
 * 
 * @param fn1 
 * @param fns 
 */
const compose = <R>( fn1: ( a: R ) => R, ...fns: Array<( a: R ) => R> ) =>
    fns.reduce( ( prevFn, nextFn ) => ( ...args: any ) => prevFn( nextFn( ...args as [ any ] ) ), fn1 )

export default compose