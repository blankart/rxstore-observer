## Firebase Login Recipe

This recipe can be used for handling login sessions using firebase and RxStore Obserer.


`loginObservers.js`

### Undecorated version:
```javascript
import { ofType } from 'rxstore-observer'
import { from } from 'rxjs'
import { map, mapTo, megeMap, tap, filter } from 'rxjs/operators'
import * as Constants from './constants'
import { setError, setUser, setLoading } from './actions'
import { loginUser as loginUserResolver, signoutUser as signoutUserResolver } from './resolvers'
import { push } from 'rxstore-react-router'

export const loginUserObserver = ( action$, store$ ) => action$.pipe(
    ofType( Constants.LOGIN_USER ),
    tap( () => action$.next( setLoading( true ) ) ),
    mergeMap( action => from( 
        loginUserResolver( 
            action.payload.email, 
            action.payload.password 
        ) ).pipe(
        tap( () => action$.next( setLoading( false ) ) ),
        filter( user => {
            if ( user.code ) {
                action$.next( setUser( undefined ) )
                action$.next( setError( userr ) )
                return false
            }
            return true
        } )
        map( user => {
            action$.next( setError( undefined ) )
            action$.next( setUser( user ) )
        } ),
    ) ),
    mapTo( push( '/dashboard' ) ),
)

export const signoutUserObserver = ( action$, store$ ) => action$.pipe(
    ofType( Constants.SIGNOUT_USER ),
    tap( () => action$.next( setLoading( true ) ) ),
    switchMap( () => from( signoutUserResolver() ) ),
    tap( () => {
        action$.next( setLoading( false ) ) 
        action$.next( setUser( undefined ) ) 
    } ),
    mapTo( push( '/login' ) )
)
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