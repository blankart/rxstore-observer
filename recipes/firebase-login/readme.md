## Firebase Login Recipe

This recipe can be used for handling login sessions using firebase and RxStore Observer.


`loginEffects.js`

### Undecorated version:
```javascript
import { ofType } from 'rxstore-observer'
import { from } from 'rxjs'
import { map, mapTo, megeMap, tap, filter, catchError } from 'rxjs/operators'
import * as Constants from './constants'
import { setError, setUser, setLoading } from './actions'
import { loginUser as loginUserResolver, signoutUser as signoutUserResolver } from './resolvers'
import { push } from 'rxstore-react-router'

export const loginUserEffect = ( action$, store$ ) => action$.pipe(
    ofType( Constants.LOGIN_USER ),
    mergeMap( action => from( 
        loginUserResolver( 
            action.payload.email, 
            action.payload.password 
        ) ).pipe(
        mergeMap( user => of(
            setLoading( false ),
            setError( undefined ),
            setUser( user ),
            push( '/dashboard' )
        )),
        catchError( error => of(
            setLoading( false ),
            setUser( undefined ),
            setError( userr ),
        ) )
    ) ),
)

export const loadingEffect = ( action$ ) => action$.pipe(
    ofType( Constants.LOGIN_USER, Constants.SIGNOUT_USER ),
    mapTo( () => setLoading( true ) )
)

export const signoutUserEffect = ( action$, store$ ) => action$.pipe(
    ofType( Constants.SIGNOUT_USER ),
    mergeMap( () => from( signoutUserResolver() ).pipe(
        mergeMap( () => of(
            setLoading( false ),
            setUser( undefined ),
            push( '/login' )
        ))
    ) )
)
```

`store.js`
```javascript
import { loginUserEffect, signoutUserEffect, loadingEffect } from './userEffects'
import { createRxStore, combineReducers } from 'rxstore-observer'
import { routerReducer } from 'rxstore-react-router'
import userReducer from './reducer'

const store = createRxStore( combineReducers( { user: userReducer, router: routerReducer } ) )
store.addEffects( [ loginUserEffect, signoutUserEffect, loadingEffect ] )
```