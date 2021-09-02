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

---

```jsx
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

## Using Decorators
```jsx
import { createRxStore, RxModel, ActionMethod, State, createModel } from 'rxstore-observer'

@RxModel
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

const { reducer, initialState, actions } = createModel( Counter )

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

## Adding side effects
```jsx
import { createRxStore, RxModel, ActionMethod, State, createModel, ofType, Observer, ActionType } from 'rxstore-observer'
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
    @Observer
    watchCounter( action$ ) {
        return action$.pipe( 
            ofType(this.incrementType, this.decrementType),
            tap(() => action$.next(this.setDone(false))),
            debounceTime(1000),
            mapTo(this.setDone(true))
        )
    }

}

const { reducer, initialState, actions, observers } = createModel( Counter )

// Create a mew store instance using `createRxStore`
const store = createRxStore( reducer, initialState )
store.addObservers( observers )
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


## Shared Models
```ts
import { createRxStore, RxModel, ActionMethod, State, createModel, ofType, Observer, ActionType, Signal } from 'rxstore-observer'

class LoadingModel {
    @State loading = false

    @ActionMethod
    setLoading( value ) {
        this.loading = value
    }
}

@RxModel
class User extends LoadingModel {
    @State user = undefined

    @ActionType('fetchUser') fetchUserType
    @ActionMethod
    fetchUser() {
        this.setLoading( true )
    }

    @ActionMethod
    userFetched( user ) {
        this.setLoading( false )
        this.user = name
    }

    @Observer
    fetchObserver( action$ ) {
        return action$.pipe(
            ofType(this.fetchUserType),
            mergeMap( () => from(userAPI()) )
            map(user => {
                return this.userFetched(user)
            })
        )
    }
}
```