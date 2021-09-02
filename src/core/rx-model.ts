import { RxReducer, Action, PreprocessedRxModelPrototype, RxModelDecorated } from '../types'

export const RxModel = <
    S extends Record<string, any>,
    T extends Action,
>( target: new () => any ): new () => any => {
    /** @internal model factory */
    const { name } = target
    const __proto__: PreprocessedRxModelPrototype<S, T> = target.prototype
    const targetInstance = new target()
    const initialState = __proto__.states.reduce( ( acc, curr ) => {
        return Object.prototype.hasOwnProperty.call( targetInstance, curr ) ?
            { ...acc, [ curr ]: targetInstance[ curr ] } :
            { ...acc, [ curr ]: null }
    }, {} as S )

    const reducersMap = __proto__.reducersMap || []
    const reducer = ( state: S = initialState, action: T ): S => {
        const reducersKeyMap: any = {}
        const switchReducerKeysMap: any = {}
        reducersMap.forEach( reducerMap => {
            reducersKeyMap[ reducerMap.key ] = reducerMap.fn
            switchReducerKeysMap[ name + '/' + reducerMap.key ] = reducerMap.fn
        } )

        if ( switchReducerKeysMap[ action.type as T['type'] ] ) {
            switchReducerKeysMap[ action.type as T['type'] ].bind( Object.assign( reducersKeyMap, state ) )( ...action.payload )
        }

        return Object.keys( state )
            .reduce( ( acc, curr ) => ( 
                { ...acc, [ curr ]: reducersKeyMap[ curr as keyof typeof reducersKeyMap ] } 
            ) ,{} ) as S
    }

    return class RxModelInstance {
        initialState: S = initialState
        reducer: RxReducer<S, T> = reducer as unknown as RxReducer<S, T>
        actions = Object.keys( __proto__.actions || {} ).reduce( ( acc, curr ) => ( { ...acc, [ curr ]: __proto__.actions[ curr ]( name ) } ) , {} )
        actionTypes = ( Object.keys( __proto__.actionTypes || {} ) ).reduce( ( acc, curr ) => ( { ...acc, [ curr ]: name + '/' + __proto__.actionTypes[ curr as keyof typeof __proto__.actionTypes ] } ), {} )
        observers = ( __proto__.observers || [] ).map( v => v.bind( { 
            ...this.actions,
            ...this.actionTypes
        } ) )
    } as unknown as new () => RxModelDecorated<S, T> 
}

export const ActionMethod = <
    T extends Action
>( target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor ) => {
    try {
        descriptor.value.bind( {} )().then( () => {
            throw new Error( `Action methods from \`${ target.constructor.name }\`: \`${ propertyKey.toString() }\` must be a synchronous function.` )
        } ).catch( () => {
            throw new Error( `Action methods from \`${ target.constructor.name }\`: \`${ propertyKey.toString() }\` must be a synchronous function.` )
        } )
    } catch { /** */}

    target.actions = {
        ...( target.actions || {} ),
        [ propertyKey ]: ( className: string ) => ( ...payload: T['payload'] ) => ( {
            type: className + '/' + propertyKey.toString(),
            payload
        } )
    }
    target.reducersMap = [
        ...( target.reducersMap || [] ),
        {
            key: propertyKey.toString(),
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
    A extends Record<string, ( ...args: any[] ) => void>,
>( Instance: new () => any ): RxModelDecorated<S, A> => {
    const modelInstance = new Instance()
    return modelInstance
}

export const ActionType = ( method: string ) => {
    return ( target: any, propertyKey: string | symbol  ) => {
        target.actionTypes =  {
            ...( target.actionTypes || {} ),
            [ propertyKey.toString() ]: method
        }
    }
}