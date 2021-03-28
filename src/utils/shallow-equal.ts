/** @internal */
const shallowEqual = ( object1: Record<string, any>, object2: Record<string, any> ): boolean => {
    if ( 
        typeof object1 !== 'object' ||
        typeof object2 !== 'object' ||
        object1 === null ||
        object2 === null 
    ) {
        return false
    }

    const keys1 = Object.keys( object1 )
    const keys2 = Object.keys( object2 )

    if ( keys1.length !== keys2.length ) {
        return false
    }

    for ( const key of keys1 ) {
        if ( object1[ key ] !== object2[ key ] ) {
            return false
        }
    }

    return true
}

export default shallowEqual