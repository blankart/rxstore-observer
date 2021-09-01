import { RxReducer, Action, PreprocessedRxModelPrototype, RxModelDecorated } from '../types'

export const RxModel = <
    S extends Record<string, any>,
    T extends Action,
>( target: new () => any ): new () => any => {
    const __proto__: PreprocessedRxModelPrototype<S, T> = target.prototype
    const reducer = ( state: S, action: T ) => {
        const newState = { ...state }
        const reducersKeyMap = ( __proto__.reducersMap || [] ).reduce( ( acc, curr ) => {
            return { ...acc, [ curr.key ]: curr.fn }
        }, {} as Record<T['type'], ( s: S ) => S> )

        if ( reducersKeyMap[ action.type as T['type'] ] ) {
            reducersKeyMap[ action.type as T['type'] ].bind( newState )( action.payload )
        }
        
        return { ...newState }
    }

    const targetInstance = new target()
    const initialState = __proto__.states.reduce( ( acc, curr ) => {
        return Object.prototype.hasOwnProperty.call( targetInstance, curr ) ?
            { ...acc, [ curr ]: targetInstance[ curr ] } :
            { ...acc, [ curr ]: null }
    }, {} as S )

    return class RxModelInstance {
        initialState: S = initialState
        reducer: RxReducer<S, T> = reducer as unknown as RxReducer<S, T>
        actions = __proto__.actions
        actionTypes = __proto__.actionTypes
        observers = ( __proto__.observers || [] ).map( v => v.bind( { 
            ...this.actions,
            ...this.actionTypes
        } ) )
    } as unknown as new () => RxModelDecorated<S, T> 
}

export const ActionMethod = <
    T extends Action
>( target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor ) => {
    if ( descriptor.value.bind( {} )() && descriptor.value.bind( {} )().then ) {
        throw new Error( `Action methods from \`${ target.constructor.name }\`: \`${ propertyKey.toString() }\` must be a synchronous function` )
    }
    target.actions = {
        ...( target.actions || {} ),
        [ propertyKey ]: ( payload: T['payload'] ) => ( {
            type: target.constructor.name + '/' + propertyKey.toString(),
            payload
        } )
    }
    target.reducersMap = [
        ...( target.reducersMap || [] ),
        {
            key: target.constructor.name + '/' + propertyKey.toString(),
            fn: descriptor.value
        }
    ]
}

export const Observer = ( target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor ) => {
    target.observers = [
        ...( target.observers || []  ),
        descriptor.value
    ]
}

export const State = ( target: any, propertyKey: any ) => {
    target.states = [
        ...( target.states || [] ),
        propertyKey
    ]
}

export const createModel = <
    S extends Record<string, any>,
    A extends Record<string, ( ...args: any ) => void>,
>( instance: any ): RxModelDecorated<S, A> => {
    const modelInstance = new instance()
    return modelInstance
}

export const ActionType = ( method: string ) => {
    return ( target: any, propertyKey: string | symbol  ) => {
        target.actionTypes =  {
            ...( target.actionTypes || {} ),
            [ propertyKey.toString() ]: target.constructor.name + '/' + method
        }
    }
}