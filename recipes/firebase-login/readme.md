## Firebase Login Recipe

This recipe can be used for handling login sessions using firebase and RxStore Obserer.


`loginObservers.js`

### Undecorated version:
```javascript
import { createObserver } from 'rxstore-observer'
import { from } from 'rxjs'
import { map, mapTo, switchMap, tap } from 'rxjs/operators'
import * as Constants from './constants'
import { setError, setUser, setLoading } from './actions'
import { loginUser as loginUserResolver, signoutUser as signoutUserResolver } from './resolvers'
import { push } from 'rxstore-react-router'

export const loginUserObserver = createObserver( Constants.LOGIN_USER, ( $action, _, dispatch ) => $action.pipe(
    tap( () => dispatch( setLoading( true ) ) ),
    switchMap( action => from( 
        loginUserResolver( 
            action.payload.email, 
            action.payload.password 
        ) ).pipe(
        map( user => {
            if ( user.code ) {
                dispatch( setLoading( false ) )
                dispatch( setUser( undefined ) )
                dispatch( setError( userr ) )
                return
            }
            dispatch( setError( undefined ) )
            dispatch( setLoading( false ) )
            dispatch( setUser( user ) )
            dispatch( push( '/dashboard' ) )
            return
        } ),
    ) ),
    mapTo( undefined ),
) )

export const signoutUserObserver = createObserver( Constants.SIGNOUT_USER, ( $action, _, dispatch ) => $action.pipe(
    tap( () => dispatch( setLoading( true ) ) ),
    switchMap( () => from( signoutUserResolver() ) ),
    tap( () => {
        dispatch( setLoading( false ) ) 
        dispatch( setUser( undefined ) ) 
        dispatch( push( '/login' ) ) 
    } ),
    mapTo( undefined ),
) )
```

`store.js`
```javascript
import { loginUserObserver, signoutUserObserver } from './userObservers'
import { createRxStore, combineReducers } from 'rxstore-observer'
import { routerReducer } from 'rxstore-react-router'
import userReducer from './reducer'

const store = createRxStore( combineReducers( { user: userReducer, router: routerReducer } ) )
store.addObservers( [ loginUserObserver, signoutUserObserver ] )
```

### Decorated version:

`LoginObservers.js`
```javascript
import { Observer } from 'rxstore-observer'
import { from } from 'rxjs'
import { map, mapTo, switchMap, tap } from 'rxjs/operators'
import * as Constants from './constants'
import { setError, setUser, setLoading } from './actions'
import { loginUser as loginUserResolver, signoutUser as signoutUserResolver } from './resolvers'
import { push } from 'rxstore-react-router'

export class LoginObservers {
    @Observer( Constants.LOGIN_USER )
    loginUserHandler( $action, _, dispatch ) => {
        return $action.pipe(
            tap( () => dispatch( setLoading( true ) ) ),
            switchMap( action => from( 
                loginUserResolver( 
                    action.payload.email, 
                    action.payload.password 
                ) ).pipe(
                map( user => {
                    if ( user.code ) {
                        dispatch( setLoading( false ) )
                        dispatch( setUser( undefined ) )
                        dispatch( setError( userr ) )
                        return
                    }
                    dispatch( setError( undefined ) )
                    dispatch( setLoading( false ) )
                    dispatch( setUser( user ) )
                    dispatch( push( '/dashboard' ) )
                    return
                } ),
            ) ),
            mapTo( undefined ),
        )
    }

    @Observer( Constants.SIGNOUT_USER )
    loginUserHandler( $action, _, dispatch ) => {
        return $action.pipe(
            tap( () => dispatch( setLoading( true ) ) ),
            switchMap( () => from( signoutUserResolver() ) ),
            tap( () => {
                dispatch( setLoading( false ) ) 
                dispatch( setUser( undefined ) ) 
                dispatch( push( '/login' ) ) 
            } ),
            mapTo( undefined ),
        )
    }
}
```

`store.js`
```javascript
import { LoginObservers } from './LoginObservers'
import { createRxStore, combineReducers } from 'rxstore-observer'
import { routerReducer } from 'rxstore-react-router'
import userReducer from './reducer'

const store = createRxStore( { user: userReducer, router: routerReducer } )
store.addObservers( [ LoginObservers ] )
```
