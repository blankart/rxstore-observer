import React, { Context, createContext } from 'react'

interface ProviderProps {
    store: unknown
    children: JSX.Element 
}

let storeContext: Context<unknown> | null = null

export const getContext = (): Context<unknown> | null => storeContext

const Provider: React.FC<ProviderProps> = ( { store, children } ) => {
    const ReactRxjsStoreContext = createContext<typeof store>( store )
    storeContext = ReactRxjsStoreContext 
    return <ReactRxjsStoreContext.Provider value={ store }>{ children }</ReactRxjsStoreContext.Provider>
}

export default Provider