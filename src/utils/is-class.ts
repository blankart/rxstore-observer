const isClass = ( func: any ) => {
    return typeof func === 'function' 
    && /^class\s/.test( Function.prototype.toString.call( func ) )
}

export default isClass