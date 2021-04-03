import { Action, ObserverActionType, ObserverFunction } from "../types"

/*@internal*/
export interface ObserverFactoryEntry<S, T extends Action> {
    type: ObserverActionType<T>, 
    observerFunction: ObserverFunction<S, T>  
}

interface ObserverFactory<
    S extends Record<string, any>, 
    T extends Action
> {
    observers: {
        [key: string]: Array<ObserverFactoryEntry<S, T>>
    }
}

export const __observerFactory: ObserverFactory<any, any> =  {
    observers: {}
}