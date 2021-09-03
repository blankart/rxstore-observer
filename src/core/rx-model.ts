import { RxReducer, Action, EffectFunction, ActionWithPayload } from '../types'

const RXSTORE_INJECTED_METAKEY = '__@@rxstore/injected'
const RXSTORE_ACTIONS_METAKEY = '__@@rxstore/actions'
const RXSTORE_ACTIONTYPES_METAKEY = '__@@rxstore/actions'
const RXSTORE_STATES_METAKEY = '__@@rxstore/states'
const RXSTORE_REDUCERSMAP_METAKEY = '__@@rxstore/reducersMap'
const RXSTORE_EFFECTS_METAKEY = '__@@rxstore/effects'

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
        let reducersKeyMap: any = { ...instance }
        const switchReducerKeysMap: any = {}
        reducersMap.forEach( reducerMap => {
            reducersKeyMap[ reducerMap.key ] = reducerMap.fn
            switchReducerKeysMap[ reducerMap.type ] = reducerMap.fn
        } )

        reducersKeyMap = Object.assign( reducersKeyMap, state )

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
function getParamNames( func: any ): Array<any> {
    const fnStr = func.toString().replace( STRIP_COMMENTS, '' )
    let result = fnStr.slice( fnStr.indexOf( '(' ) + 1, fnStr.indexOf( ')' ) ).match( ARGUMENT_NAMES )
    if( result === null )
        result = []
    return result
}

export const Injectable: ClassDecorator = target => { 
    const paramTypes: any = Reflect.getMetadata( 'design:paramtypes', target ) || []
    const parametersNames = getParamNames( target )
    parametersNames.forEach( ( paramName, idx ) => {
        target.prototype[ paramName as keyof typeof target ] = paramTypes[ idx as keyof typeof paramTypes ].prototype
    } )
    Reflect.defineMetadata( RXSTORE_INJECTED_METAKEY, paramTypes, target )
}

/** @internal */
export class Model<
    S extends Record<string, any>,
    A extends Record<string, ( ...args: any ) => void>,
    I extends new ( ...args: any ) => any = new ( ...args: any ) => any
> {
    initialState: S
    actions: { [ K in keyof A ]: ( ...a: Parameters<A[K]> ) => ActionWithPayload<K, Parameters<A[K]>> }
    effects: Array<EffectFunction<S, { [ K in keyof A ]: ActionWithPayload<K, Parameters<A[K]>> }[ keyof A ]>>
    reducer: RxReducer<S, { [ K in keyof A ]: ActionWithPayload<K, Parameters<A[K]>> }[ keyof A ]>

    constructor( ClassInstance: I ) {
        const { name } = ClassInstance
        const injectedObject: any = {}
        const parametersNames = getParamNames( ClassInstance.prototype.constructor )
        const metadata =  Reflect.getMetadata<typeof ClassInstance>( RXSTORE_INJECTED_METAKEY, ClassInstance ) as unknown as any[] || [] 
        if ( parametersNames.length && metadata.length === 0 ) {
            throw new Error( `\`${ name }\` class must be injectable to access \`${ parametersNames.join( ', ' ) }\`. Make the class injectable by adding the @Injectable decorator.` )
        }
        /** @internal model factory */
        metadata
            .forEach( ( v, i ) => {
                const propertyTypes: any = {}
                const actions = ( Reflect.getMetadata( RXSTORE_ACTIONS_METAKEY, v.prototype ) || {} ) as any
                const actionTypes = ( Reflect.getMetadata( RXSTORE_ACTIONTYPES_METAKEY, v.prototype ) || [] ) as []
                Object.getOwnPropertyNames( v.prototype ).forEach( value => {
                    if ( value === 'constructor' ) {
                        return
                    }
                    propertyTypes[ value ] = v.prototype[ value ]
                } )
                injectedObject[ parametersNames[ i ] ] = {
                    ...propertyTypes,
                    ...actions,
                    ...actionTypes
                }
            } ) 
    
        const __proto__ = ClassInstance.prototype
        const targetInstance = new ClassInstance()
        Object.getOwnPropertyNames( __proto__ ).forEach( value => {
            if ( value === 'constructor' ) {
                return
            }
            injectedObject[ value ] = __proto__[ value as keyof typeof __proto__ ]
        } )
        const states = ( Reflect.getMetadata( RXSTORE_STATES_METAKEY, ClassInstance.prototype ) || [] ) as []
        const reducersMap = ( Reflect.getMetadata( RXSTORE_REDUCERSMAP_METAKEY, ClassInstance.prototype ) || [] ) as []
        const actions = ( Reflect.getMetadata( RXSTORE_ACTIONS_METAKEY, ClassInstance.prototype ) || {} ) as any
        const actionTypes = ( Reflect.getMetadata( RXSTORE_ACTIONTYPES_METAKEY, ClassInstance.prototype ) || [] ) as []
        const effects = ( Reflect.getMetadata( RXSTORE_EFFECTS_METAKEY, ClassInstance.prototype ) || [] ) as Array<EffectFunction<S, { [ K in keyof A ]: ActionWithPayload<K, Parameters<A[K]>> }[ keyof A ]>>
        const initialState = generateStateObject( targetInstance, states ) as S
        const reducer = generateReducerFunction( name, injectedObject, reducersMap, initialState )

        this.initialState = initialState
        this.reducer = reducer
        this.actions = actions
        this.effects = effects.map( v => v.bind( { 
            ...injectedObject,
            ...actions,
            ...actionTypes
        } ) )
    }
}

export const ActionMethod = <
    T extends Action
>( target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<{ ( ...args: any ): void | undefined }> ) => {
    let isPromise = false
    try {
        /**
         * Don't allow promise based actions since reducers are designed to be
         * synchronous.
         */
        isPromise = ( descriptor.value as any ).bind( {} )() instanceof Promise
    } catch { /** */}

    if ( isPromise ) {
        throw new Error( `Action methods from \`${ target.constructor.name }\`: \`${ propertyKey.toString() }\` must be a synchronous function.` )
    }

    Reflect.defineMetadata( RXSTORE_ACTIONS_METAKEY, {
        ...( Reflect.getMetadata( RXSTORE_ACTIONS_METAKEY, target ) || {} as any ),
        [ propertyKey ]: ( ...payload: T['payload'] ) => ( {
            type: `[${ target.constructor.name }] ${ propertyKey.toString() }`,
            payload
        } )
    }, target )

    Reflect.defineMetadata( RXSTORE_REDUCERSMAP_METAKEY, [
        ...( Reflect.getMetadata( RXSTORE_REDUCERSMAP_METAKEY, target ) || [] as any ),
        {
            type: `[${ target.constructor.name }] ${ propertyKey.toString() }`,
            key: propertyKey.toString(),
            fn: descriptor.value
        }
    ], target )
}

export const Effect = ( target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor ) => {
    Reflect.defineMetadata( RXSTORE_EFFECTS_METAKEY, [
        ...( Reflect.getMetadata( RXSTORE_EFFECTS_METAKEY, target ) || [] as any ),
        descriptor.value
    ], target )
}

export const State = ( target: any, propertyKey: any ) => {
    Reflect.defineMetadata( RXSTORE_STATES_METAKEY, [
        ...( Reflect.getMetadata( RXSTORE_STATES_METAKEY, target ) || [] as any ),
        propertyKey
    ], target )
}

export const ActionType = ( method: string ) => {
    return ( target: any, propertyKey: string | symbol  ) => {
        target[ propertyKey.toString() ] = `[${ target.constructor.name }] ${ method }`
        Reflect.defineMetadata( RXSTORE_ACTIONTYPES_METAKEY, {
            ...( Reflect.getMetadata( RXSTORE_ACTIONTYPES_METAKEY, target ) || {} as any ),
            [ propertyKey.toString() ]: `[${ target.constructor.name }] ${ method }`
        }, target )
    }
}