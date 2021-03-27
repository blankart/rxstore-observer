
import Provider  from '../provider'
import useStore from '../use-store'
import { reducer } from '#templates/mock-store'
import { createRxjsStore } from '#core'
import React from 'react'
import { act, render } from '@testing-library/react'

describe( 'useStore', () => {
    test( 'useStore state', () => {
        const dummyStore = createRxjsStore( reducer )
        const Container = () => <Provider store={ dummyStore }><DummyApp/></Provider>
        const DummyApp = () => {
            const store = useStore( state => state )
            return <div data-testid="store-state">{ JSON.stringify( store ) }</div>
        } 
        const { getByTestId, rerender } = render( <Container/> )
        act( () => {
            dummyStore.dispatch( { type: 'CHANGE_DUMMY_FIELD_1', payload: 'Changed' } )
        } )
        rerender( <Container/> )
        expect( getByTestId( 'store-state' ).innerHTML ).toBe( JSON.stringify( dummyStore.getState() ) )
    } )
} )