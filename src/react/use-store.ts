import { RxJsStore } from '#types'
import { Context, useContext, useEffect, useState } from 'react'
import { getContext } from './provider'
import { isEqual } from 'lodash'

const useStore = <
    T = Record<string, any>,
>( storeFunction: ( store: T ) => Partial<T> | T ): Partial<T> | T => {
    const context = useContext( getContext() as Context<RxJsStore<T, any, any, any>> )
    const [ state, setState ] = useState( storeFunction( context.getState() ) )
    useEffect( () => {
        context.subscribe( ( _state: T ) => {
            if ( ! isEqual( state, _state ) ) {
                setState( storeFunction( _state ) )
            }
        } )
    }, [] )

    return state 
}

export default useStore