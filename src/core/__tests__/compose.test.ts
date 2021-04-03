import compose from '../compose'

describe( 'compose', () => {
    test( 'composing multiple functions', () => {
        const mockFunction1 = jest.fn( ( a: number ) => a + 1 )
        const mockFunction2 = jest.fn( ( a: number ) => a + 1 )
        const mockFunction3 = jest.fn( ( a: number ) => a + 1 )
        const mockFunction4 = jest.fn( ( a: number ) => a + 1 )
        const mockFunction5 = jest.fn( ( a: number ) => a + 1 )

        const composedMockFunction = compose( mockFunction1, mockFunction2, mockFunction3, mockFunction4, mockFunction5 )
        expect( composedMockFunction( 0 ) ).toBe( 5 )
        expect( mockFunction1 ).toBeCalledTimes( 1 )
        expect( mockFunction2 ).toBeCalledTimes( 1 )
        expect( mockFunction3 ).toBeCalledTimes( 1 )
        expect( mockFunction4 ).toBeCalledTimes( 1 )
        expect( mockFunction5 ).toBeCalledTimes( 1 )
    } )
} )