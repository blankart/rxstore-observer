const isClass = ( func: any ) => {
    return typeof func === 'function' 
    && /(^class\s|_classCallCheck)/.test( Function.prototype.toString.call( func ) )
}

export default isClass