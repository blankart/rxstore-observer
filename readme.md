![https://firebasestorage.googleapis.com/v0/b/reneenico-freedom-wall.appspot.com/o/RxStore%20Observable%20Banner.jpg?alt=media&token=84e14c8f-9a16-4bf8-8ebb-2d020a317746](https://firebasestorage.googleapis.com/v0/b/reneenico-freedom-wall.appspot.com/o/RxStore%20Observable%20Banner.jpg?alt=media&token=84e14c8f-9a16-4bf8-8ebb-2d020a317746)

# rxstore-observer
RxStore Observer is a redux-inspired state management library using [ReactiveX](http://reactivex.io/) at its core. This provides a complete tool for scalable javascript applications by offering built-in side-effects handling using *Observables.*

## Getting Started

---

Install using npm:

```jsx
npm install rxstore-observer --save
```

Install using yarn:
```
yarn add rxstore-observer
```

## Usage Sample

```typescript
import { createRxStore, RxModel, ActionMethod, State } from 'rxstore-observer'

class Counter {
    @State counter = 0

    @ActionMethod
    increment() {
        this.counter+= 1
    }

    @ActionMethod
    decrement() {
        this.counter+= 1
    }
}

const { reducer, initialState, actions } = new RxModel( Counter )

// Create a mew store instance using `createRxStore`
const store = createRxStore( reducer, initialState )
store.subscribe( (action) => {
    // Subscribing to any state changes inside your store continer.
    console.log( 'ACTION DISPATCHED: ', action )
    console.log( 'CURRENT STATE: ', store.getState() ) 
} )

// Used for dispatching an action to the store.
store.dispatch( actions.increment() )
```

---
## Using Redux Patterns

```typescript
import { createRxStore } from 'rxstore-observer'

const initialState = {
    counter: 0
}

const reducer = (state = initialState, action ) => {
    switch (action.type) {
        case 'INCREMENT': return { ...state, counter: state.counter + 1 }
        case 'DECREMENT': return { ...state, counter: state.counter - 1 }
        default: return state
    }
}

// Create a mew store instance using `createRxStore`
const store = createRxStore( reducer )

store.subscribe( (action) => {
    // Subscribing to any state changes inside your store continer.
    console.log( 'ACTION DISPATCHED: ', action )
    console.log( 'CURRENT STATE: ', store.getState() ) 
} )

// Used for dispatching an action to the store.
store.dispatch( { type: 'INCREMENT' } )
```


## Adding side effects
```typescript
import { createRxStore, RxModel, ActionMethod, State, ofType, Effect, ActionType } from 'rxstore-observer'
import { debounceTime, mapTo, tap } from 'rxjs/operators'

@RxModel
class Counter {
    @State counter = 0
    @State done = false

    // ActionType parameter should match its ActionMethod's method name!
    @ActionType('increment') incrementType
    @ActionMethod
    increment() {
        this.counter+= 1
    }

    @ActionType('decrement') decrementType
    @ActionMethod
    decrement() {
        this.counter+= 1
    }

    @ActionMethod
    setDone( value ) {
        this.done = value
    }

    // Using RxJS Observables!
    @Effect watchCounter1( action$ ) {
        return action$.pipe(
            ofType(this.incrementType, this.decrementType),
            mapTo(() => this.setDone(false))
        )
    }

    @Effect watchCounter2( action$ ) {
        return action$.pipe( 
            ofType(this.incrementType, this.decrementType),
            debounceTime(1000),
            mapTo(this.setDone(true))
        )
    }

}

const { reducer, initialState, actions, effects } = new RxModel( Counter )

// Create a mew store instance using `createRxStore`
const store = createRxStore( reducer, initialState )
store.addEffects( effects )
store.subscribe( (action) => {
    // Subscribing to any state changes inside your store continer.
    console.log( 'ACTION DISPATCHED: ', action )
    console.log( 'CURRENT STATE: ', store.getState() ) 
} )

store.dispatch( actions.increment() )
```

Output:
```
ACTION DISPATCHED: { type: 'Counter/increment', payload: undefined }
CURRENT STATE: { counter: 1, done: false }
ACTION DISPATCHED: { type: 'Counter/setDone', payload: false }
CURRENT STATE: { counter: 1, done: false }

// After 1000ms
ACTION DISPATCHED: { type: 'Counter/setDone', payload: true }
CURRENT STATE: { counter: 1, done: true }
```

---
## Injectable Services
```typescript
import { State, ActionMethod, Injectable, Effect, ofType } from 'rxstore-observer'
import { fromPromise, of } from 'rxjs'
import { mapTo, mergeMap } from 'rxjs/operators'

@Injectable
class UserService {
    fetchUsers() {
        return fromPromise(await fetch(<USERS_API_HERE>))
    }
}

@Injectable
class UserStore {
    @State loading = false
    @State users = []

    @ActionType('fetchUsers') fetchUsersType

    @ActionMethod fetchUsers() {}
    @ActionMethod setUsers(users) { this.users = users }
    @ActionMethod setLoading(toggle) { this.loading = toggle }

    @Effect toggleLoading (action$) {
        return action$.pipe(
            ofType(this.fetchUsersType),
            mapTo(this.setLoading(true))
        )
    }

    @Effect fetchUsersEffect(action$) {
        return action$.pipe(
            ofType(this.fetchUsersType),
            mergeMap(() => this.userService.fetchUsers().pipe(
                mergeMap(users => of(
                    this.setUsers(users),
                    this.setLoading(false)
                ))
            )),
        )
    }

    constructor(
        protected userService: UserService
    ) {}
}
```