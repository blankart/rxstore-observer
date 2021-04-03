![https://firebasestorage.googleapis.com/v0/b/reneenico-freedom-wall.appspot.com/o/RxStore%20Observable%20Banner.jpg?alt=media&token=84e14c8f-9a16-4bf8-8ebb-2d020a317746g](https://firebasestorage.googleapis.com/v0/b/reneenico-freedom-wall.appspot.com/o/RxStore%20Observable%20Banner.jpg?alt=media&token=84e14c8f-9a16-4bf8-8ebb-2d020a317746g)

RxStore Observable is a powerful redux-inspired state management library using [ReactiveX](http://reactivex.io/) as its core. This provides a complete tool for scalable javascript applications by offering built-in side-effects handling using *Observables.*

## Usage

> Why should i switch to *RxStore Observable?*

```jsx
import { createObserver } from 'rxstore-observer'
import Api from './api'
import { mergeMap, map, tap, debounceTime } from 'rxjs/operators'
import { from } from 'rxstore'
import store from './store'

const whenStartFetching = createObserver( 'START_FETCHING', ( $action, getState, dispatch ) => {
   return $action.pipe(
       // debounces the action pipe to avoid multiple server fetching.
       debounceTime( 1000 ),
       // dispatches an action which fires a loading indicator.
       tap( () => dispatch( { type: 'IS_FETCHING', payload: true } ) ),
       // gets the result from an external asynchronous function.
       mergeMap( action => from( Api.fetch( action.payload ) ),
       // sets the loading state to false.
       tap( () => dispatch( { type: 'IS_FETCHING', payload: false } ),
       // end of the action stream. dispatches the result.
       map( result => ( { type: 'END_FETCHING', result } ) )
   )
} )

store.addObservers( [ whenStartFetching ] )
```

The `store` is a store instance using `createRxStore` function. It will automatically subscribe to any dispatched function of type `START_FETCHING` to run some side-effects to the store. It dispatches `IS_FETCHING` in the middle of the stream of actions which is dispatched immediately. As your application gets bigger, RxStore Observer promises to handle most of the work. 🎊

When building your app, you dont’t need to think about your application side-effects again after writing it.

If you’re not familiar with [Redux](https://redux.js.org/) and [ReactiveX](http://reactivex.io/), it might be a little bit challenging at first. This is a powerful tool for code-splitting and predictability of your application state.

## Why Observers?

---

![https://firebasestorage.googleapis.com/v0/b/reneenico-freedom-wall.appspot.com/o/RxStore%20Observer%20Diagram.jpg?alt=media&token=a903bd67-4e87-493c-89b2-277798346fd9](https://firebasestorage.googleapis.com/v0/b/reneenico-freedom-wall.appspot.com/o/RxStore%20Observer%20Diagram.jpg?alt=media&token=a903bd67-4e87-493c-89b2-277798346fd9)

Since *action objects* act like a stream of objects used for redefining the next shape of the store, it would make more sense to convert it to an observable. Defining more observers using `addObserver` or `addObservers` creates a new observable instance subscribed to the original action streams. By looking at the example above, the `createObserver` function passes an `$action` , which is the original action stream of your store. It then returns a new `$action` observable instance which can be used for subscribing to the current action dispatched. 

## Getting Started

---

For installing RxStore core:

```jsx
npm install rxstore-observer --save
```

## Creating your first RxStore

---

Since this library is heavily inspired by Redux, you may want to learn basic concepts [here](https://redux.js.org/tutorials/essentials/part-1-overview-concepts).

To create a new store:

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

If you're coming from Redux, this is already a familiar pattern for creating a store. Because in fact, this library works like Redux under the hood. You can pass existing redux store enhancers in `createRxStore` .

## Creating your first `observers`

---

Similar to how [Redux-observable](https://redux-observable.js.org/) and [Redux Saga](https://redux-saga.js.org/) works, it can perform various side-effects based on current action being dispatch inside your store. This is a built-in feature of RxStore Observer.

To create an observer:

```jsx
import store from './store'
import { mapTo } from 'rxjs/operators'

// Observes to all occurrences of LISTEN_TO_ME action type then dispatch I_AM_LISTENING.
store.addObserver( "LISTEN_TO_ME", $action => $action.pipe(
		mapTo({ type: "I_AM_LISTENING" } )
) )

/** 
You can also observe to all actions dispatched to the store.
**/
store.addObserver( "*", $action => $action.pipe(
    mapTo( { type: "BROADCAST_MESSAGE", message: "An action has been dispatched." } )
) ) 

```

Alternatively, you can create multiple instances of `observers` then pass it inside the `addObservers` function.

```jsx
import { createObserver } from 'rxstore-observer'
import { mapTo } from 'rxjs/operators'
import store from './store'

// Observes to all occurrences of LISTEN_TO_ME action type then dispatch I_AM_LISTENING.
const listenToMeObserver = createObserver( "LISTEN_TO_ME", $action => $action.pipe(
		mapTo( { type: "I_AM_LISTENING" } )
) 

/** 
You can also observe to all actions dispatched to the store.
**/
const listenToAllObserver = createObserver( "*", $action => $action.pipe(
    mapTo( { type: "BROADCAST_MESSAGE", message: "An action has been dispatched." } )
) ) 

store.addObservers( [ listenToMeObserver, listenToAllObserver ] )
```

Both approaches do the same. 

### Don't do this:
```javascript
/**
 * This will result to an infinite loop to your store.
 * Since we're creating a new instance of the action
 * observable stream, it will dispatch the same action
 * piped to it. 
 * */
store.addObserver( "AN_ACTION_TYPE", $action => $action )
```


## Documentations

---

Since the project is currently in development, the existing APIs will most likely change. Before building an official documentation, it's important that this library is battle tested for production sites.

Documentations page will be constructed soon.