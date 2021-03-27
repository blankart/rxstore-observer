import Provider, { getContext } from '../provider'
import { reducer } from '#templates/mock-store'
import { createRxjsStore } from '#core'
import React, { Context, useContext } from 'react'
import { render } from '@testing-library/react'

describe( 'Provider', () => {
    test( 'Provider state', () => {
        const dummyStore = createRxjsStore( reducer )
        const Container = () => <Provider store={ dummyStore }><DummyApp/></Provider>
        const DummyApp = () => {
            const contextValue = useContext( getContext() as Context<{ getState: () => any }> )
            return <div data-testid="get-state">{ JSON.stringify( contextValue.getState() ) }</div>
        } 
        const { getByTestId } = render( <Container/> )
        expect( getByTestId( 'get-state' ).innerHTML ).toBe( JSON.stringify( dummyStore.getState() ) )
        
    } )
} )