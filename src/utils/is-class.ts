const toString = Function.prototype.toString

const fnBody = ( fn: () => any ): string => {
    return toString.call( fn ).replace( /^[^{]*{\s*/, '' ).replace( /\s*}[^}]*$/, '' )
}

// @see https://github.com/miguelmota/is-class/blob/master/is-class.js
const isClass =  ( fn: any ): boolean => {
    if ( typeof fn !== 'function' ) {
        return false
    }

    if ( /^class[\s{]/.test( toString.call( fn ) ) ) {
        return true
    }

    const body = fnBody( fn )
    return ( /classCallCheck\(/.test( body ) || /TypeError\("Cannot call a class as a function"\)/.test( body ) )
}

export default isClass