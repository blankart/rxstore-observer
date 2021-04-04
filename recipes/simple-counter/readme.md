## Simple Counter Store Recipe 
A simple counter store using RxStore Observer.

```javascript
import { createRxStore } from 'rxstore-observer'

const counterState = {
    count: 0
}

const reducer = ( state = counterState, action ) => {
    switch ( action.type ) {
        case "INCREMENT": { return { ...state, counter: state.counter + 1 } }
        case "DECREMENT": { return { ...state, counter: state.counter - 1 } }
        case "RESET": { return { ...state, counter: 0 } }
        default: return state
    }
}

const store = createRxStore( reducer )

```

Dispatching an action:
```javascript
store.dispatch( { type: "INCREMENT" } )
console.log( store.getState() ) // { count: 1 }
store.dispatch( { type: "INCREMENT" } )
console.log( store.getState() ) // { count: 2 }
store.dispatch( { type: "DECREMENT" } )
console.log( store.getState() ) // { count: 1 }
store.dispatch( { type: "INCREMENT" } )
console.log( store.getState() ) // { count: 2 }
store.dispatch( { type: "RESET" } )
console.log( store.getState() ) // { count: 0 }
```

