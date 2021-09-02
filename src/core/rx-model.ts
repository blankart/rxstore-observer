import { RxReducer, Action, PreprocessedRxModelPrototype, RxModelDecorated } from '../types'

/** @internal */
const generateStateObject = <S>( classInstance: S, keys: Array<Partial<keyof S>> ): Partial<S> => {
    return ( keys || [] ).reduce( ( acc, curr ) => {
        return Object.prototype.hasOwnProperty.call( classInstance, curr ) ?
            { ...acc, [ curr ]: classInstance[ curr ] } :
            { ...acc, [ curr ]: null }
    }, {} as Partial<S> )
}

/** @internal */
const generateReducerFunction = <S, T extends Action>( name: string, instance: new ( ...args: any ) => any, reducersMap: any[], initialState: S ) => {
    return ( state: S = initialState, action: T ): S => {
        const reducersKeyMap: any = { ...instance }
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
}

/** @internal */
const STRIP_COMMENTS = /(\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s*=[^,]*(('(?:\\'|[^'\r\n])*')|("(?:\\"|[^"\r\n])*"))|(\s*=[^,]*))/mg
const ARGUMENT_NAMES = /([^\s,]+)/g
function getParamNames( func: ( ...args: any ) => any ): Array<any> {
    const fnStr = func.toString().replace( STRIP_COMMENTS, '' )
    let result = fnStr.slice( fnStr.indexOf( '(' ) + 1, fnStr.indexOf( ')' ) ).match( ARGUMENT_NAMES )
    if( result === null )
        result = []
    return result
}

export const RxModel = <
    S extends Record<string, any>,
    T extends Action,
>( target: new ( ...args: any ) => any ): new ( ...args: any ) => any => {
    const { name } = target
    const injectedObject: any = {}
    const parametersNames = getParamNames( target.prototype.constructor )
    const metadata =  Reflect.getMetadata<typeof target>( 'design:paramtypes', target ) as unknown as any[] || [] 
    /** @internal model factory */
    metadata
        .forEach( ( v, i ) => {
            const propertyTypes: any = {}
            Object.getOwnPropertyNames( v.prototype ).forEach( value => {
                if ( value === 'constructor' ) {
                    return
                }
                propertyTypes[ value ] = v.prototype[ value ]
            } )
            injectedObject[ parametersNames[ i ] ] = propertyTypes
        } ) 
    
    const __proto__: PreprocessedRxModelPrototype<S, T> = target.prototype
    const targetInstance = new target()
    Object.getOwnPropertyNames( __proto__ ).forEach( value => {
        if ( [ 'states', 'actions', 'reducersMap', 'constructor' ].includes( value ) ) {
            return
        }
        injectedObject[ value ] = __proto__[ value as keyof typeof __proto__ ]
    } )
    const states = __proto__.states || []
    const reducersMap = [ ...( __proto__.reducersMap || [] ) ]
    const initialState = generateStateObject( targetInstance, states ) as S
    const reducer = generateReducerFunction( name, injectedObject, reducersMap, initialState )

    return class RxModelInstance {
        initialState: S = initialState
        reducer: RxReducer<S, T> = reducer as unknown as RxReducer<S, T>
        actions = Object.keys( __proto__.actions || {} ).reduce( ( acc, curr ) => ( { ...acc, [ curr ]: __proto__.actions[ curr ]( name ) } ) , {} )
        actionTypes = ( Object.keys( __proto__.actionTypes || {} ) ).reduce( ( acc, curr ) => ( { ...acc, [ curr ]: name + '/' + __proto__.actionTypes[ curr as keyof typeof __proto__.actionTypes ] } ), {} )
        observers = ( __proto__.observers || [] ).map( v => v.bind( { 
            ...injectedObject,
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
>( Instance: new ( ...args: any ) => any ): RxModelDecorated<S, A> => {
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