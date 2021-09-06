import { RxReducer, EffectFunction, ActionWithPayload } from '../types'

const RXSTORE_INJECTED_METAKEY = '__@@rxstore/injected'
const RXSTORE_ACTIONS_METAKEY = '__@@rxstore/actions'
const RXSTORE_ACTIONTYPES_METAKEY = '__@@rxstore/actions'
const RXSTORE_STATES_METAKEY = '__@@rxstore/states'
const RXSTORE_REDUCERSMAP_METAKEY = '__@@rxstore/reducersMap'
const RXSTORE_EFFECTS_METAKEY = '__@@rxstore/effects'

/** @internal */
const __genStateObject = <S>( classInstance: S, keys: Array<Partial<keyof S>> ): Partial<S> => {
    return ( keys || [] ).reduce( ( acc, curr ) => {
        return Object.prototype.hasOwnProperty.call( classInstance, curr ) ?
            { ...acc, [ curr ]: classInstance[ curr ] } :
            { ...acc, [ curr ]: null }
    }, {} as Partial<S> )
}

/** @internal */
const __genReducer = <S, T extends ActionWithPayload>( name: string, instance: new ( ...args: any ) => any, reducersMap: any[], initialState: S ) => {
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
const __extractMappedRxModelProperties = ( target: any ) => {
    const propertyTypes: any = {}
    const actions = ( Reflect.getMetadata( RXSTORE_ACTIONS_METAKEY, target ) || {} ) as any
    const actionTypes = ( Reflect.getMetadata( RXSTORE_ACTIONTYPES_METAKEY, target ) || [] ) as []
    Object.getOwnPropertyNames( target ).forEach( value => {
        if ( value === 'constructor' ) {
            return
        }
        propertyTypes[ value ] = target[ value ]
    } )

    return { ...propertyTypes, ...actions, ...actionTypes }
}

/** @internal InjectableModule container */
export const Injectable: ClassDecorator = ( target: any ) => { 
    const paramTypes: any = Reflect.getMetadata( 'design:paramtypes', target ) || []

    /** access injectable from constructor */
    if ( paramTypes ) {
        const newInstance = new target( ...paramTypes || [] )
        Object.keys( newInstance ).forEach( key => {
            if ( paramTypes.some( ( pt: any ) => {
                return typeof newInstance[ key ] === 'function' && new pt() instanceof newInstance[ key ] 
            } ) ) {
                if ( ! Reflect.hasMetadata( RXSTORE_INJECTED_METAKEY, newInstance[ key ] ) ) {
                    console.warn( `${ newInstance[ key ].name } is not an injectable class. Make sure to decorate your class with @Injectable to access it.` )
                    return
                }

                target.prototype[ key ] = __extractMappedRxModelProperties( newInstance[ key ].prototype )
            }
        } )
    }

    /** make this class injectable */
    Reflect.defineMetadata( RXSTORE_INJECTED_METAKEY, paramTypes, target )
}

/** @internal */
export class RxModel<
    S extends Record<string, any>,
    A extends Record<string, ( ...args: any ) => void>,
    I extends new ( ...args: any ) => any = new ( ...args: any ) => any
> {
    initialState: S
    actions: { [ K in keyof A ]: ( ...a: Parameters<A[K]> ) => ActionWithPayload<K, Parameters<A[K]>> }
    effects: Array<EffectFunction<S, { [ K in keyof A ]: ActionWithPayload<K,Parameters<A[K]>> }[ keyof A ]>>
    reducer: RxReducer<S, { [ K in keyof A ]: ActionWithPayload<K,Parameters<A[K]>> }[ keyof A ]>

    constructor( ClassInstance: I ) {
        this.init( ClassInstance )
    }

    init( ClassInstance: I ) {
        const { name } = ClassInstance
        const injectedObject: any = {}
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
        const actionTypes = ( Reflect.getMetadata( RXSTORE_ACTIONTYPES_METAKEY, ClassInstance.prototype ) || [] ) as []
        const effects = ( Reflect.getMetadata( RXSTORE_EFFECTS_METAKEY, ClassInstance.prototype ) || [] ) as Array<EffectFunction<S, { [ K in keyof A ]: ActionWithPayload<K,Parameters<A[K]>> }[ keyof A ]>>
        const initialState = __genStateObject( targetInstance, states ) as S
        this.actions = ( Reflect.getMetadata( RXSTORE_ACTIONS_METAKEY, ClassInstance.prototype ) || {} ) as any
        this.initialState = initialState
        Object.assign( injectedObject, this.actions, actionTypes )
        this.reducer = __genReducer( name, injectedObject, reducersMap, initialState )
        this.effects = effects.map( v => v.bind( injectedObject ) )
    }
}

export const ActionMethod = <
    T extends ActionWithPayload
>( target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<{ ( ...args: any ): void | undefined }> ) => {
    let isPromise = false
    try {
        /**
         * Don't allow promise based actions since reducers are designed to be
         * synchronous.
         */
        isPromise = ( new RegExp( [ "AsyncFunction", "Promise" ].join( '|' ) ) ).test( Function.prototype.toString.call( descriptor.value ) )  || ( !! descriptor.value && descriptor.value.bind( {} )() as any instanceof Promise )
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