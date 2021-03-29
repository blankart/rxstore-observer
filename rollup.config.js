import nodeResolve from '@rollup/plugin-node-resolve'
import babel from '@rollup/plugin-babel'
import replace from '@rollup/plugin-replace'
import typescript from '@rollup/plugin-typescript'
import { terser } from 'rollup-plugin-terser'

import pkg from './package.json'

const extensions = [ '.ts' ]

const babelRuntimeVersion = pkg.dependencies[ '@babel/runtime' ].replace(
    /^[^0-9]*/,
    ''
)

const makeExternalPredicate = externalArr => {
    if ( externalArr.length === 0 ) {
        return () => false
    }
    const pattern = new RegExp( `^(${ externalArr.join( '|' ) })($|/)` )
    return id => pattern.test( id )
}

export default [
    // CommonJS
    {
        input: 'src/index.ts',
        output: { file: 'lib/rxstore-watch.js', format: 'cjs', indent: false },
        external: makeExternalPredicate( [
            ...Object.keys( pkg.dependencies || {} ),
            ...Object.keys( pkg.peerDependencies || {} ),
        ] ),
        plugins: [
            nodeResolve( {
                extensions,
            } ),
            typescript( { declaration: false } ),
            babel( {
                extensions,
                plugins: [
                    [ '@babel/plugin-transform-runtime', { version: babelRuntimeVersion } ],
                ],
                babelHelpers: 'runtime'
            } ),
        ],
    },

    // ES
    {
        input: 'src/index.ts',
        output: { file: 'es/rxstore-watch.js', format: 'es', indent: false },
        external: makeExternalPredicate( [
            ...Object.keys( pkg.dependencies || {} ),
            ...Object.keys( pkg.peerDependencies || {} ),
        ] ),
        plugins: [
            nodeResolve( {
                extensions,
            } ),
            typescript( { declaration: false } ),
            babel( {
                extensions,
                plugins: [
                    [
                        '@babel/plugin-transform-runtime',
                        { version: babelRuntimeVersion, useESModules: true },
                    ],
                ],
                babelHelpers: 'runtime'
            } ),
        ],
    },

    // ES for Browsers
    {
        input: 'src/index.ts',
        output: { file: 'es/rxstore-watch.mjs', format: 'es', indent: false },
        plugins: [
            nodeResolve( {
                extensions,
            } ),
            replace( {
                preventAssignment: true,
                'process.env.NODE_ENV': JSON.stringify( 'production' ),
            } ),
            typescript( { declaration: false } ),
            babel( {
                extensions,
                exclude: 'node_modules/**',
            } ),
            terser( {
                compress: {
                    pure_getters: true,
                    unsafe: true,
                    unsafe_comps: true,
                    warnings: false,
                },
            } ),
        ],
    },

    // UMD Development
    {
        input: 'src/index.ts',
        output: {
            file: 'dist/rxstore-watch.js',
            format: 'umd',
            name: 'Rxstore Watch',
            indent: false,
        },
        plugins: [
            nodeResolve( {
                extensions,
            } ),
            typescript( { declaration: false } ),
            babel( {
                extensions,
                exclude: 'node_modules/**',
            } ),
            replace( {
                preventAssignment: true,
                'process.env.NODE_ENV': JSON.stringify( 'development' ),
            } ),
        ],
    },

    // UMD Production
    {
        input: 'src/index.ts',
        output: {
            file: 'dist/rxstore-watch.min.js',
            format: 'umd',
            name: 'Rxstore Watch',
            indent: false,
        },
        plugins: [
            nodeResolve( {
                extensions,
            } ),
            typescript( { declaration: false } ),
            babel( {
                extensions,
                exclude: 'node_modules/**',
            } ),
            replace( {
                preventAssignment: true,
                'process.env.NODE_ENV': JSON.stringify( 'production' ),
            } ),
            terser( {
                compress: {
                    pure_getters: true,
                    unsafe: true,
                    unsafe_comps: true,
                    warnings: false,
                },
            } ),
        ],
    },
]
