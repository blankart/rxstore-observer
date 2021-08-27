import { Action, ObserverFunction } from "../types"

interface ObserverFactory<
    S extends Record<string, any>, 
    T extends Action
> {
    observers: {
        [key: string]: Array<ObserverFunction<S, T>>
    }
}

/**
 * For internal use only.
 * This is where all decorated
 * class methods are stored.
 * 
 * When decorating a class method,
 * the functions are stored here and
 * indexed by its class name.
 * @internal
 */
export const __observerFactory: ObserverFactory<any, any> =  {
    observers: {}
}