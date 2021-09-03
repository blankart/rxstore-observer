## Simple Counter Store Recipe 
A simple counter store using RxStore Effect.

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

### Decorated Version
```typescript
import { createRxStore, RxModel, ActionMethod, State } from 'rxstore-observer'

@RxModel
class SimpleCounter {
    @State counter = 0

    @ActionMethod increment() {
        this.counter++
    }

    @ActionMethod decrement() {
        this.counter--
    }

    @ActionMethod reset() {
        this.counter = 0
    }
}

const { reducer, actions } = new RxModel( SimpleCounter )
const store = createRxStore( reducer )

```

Dispatching an action:
```typescript
store.dispatch( actions.increment() )
console.log( store.getState() ) // { count: 1 }
store.dispatch( actions.increment() )
console.log( store.getState() ) // { count: 2 }
store.dispatch( actions.decrement() )
console.log( store.getState() ) // { count: 1 }
store.dispatch( action.increment() )
console.log( store.getState() ) // { count: 2 }
store.dispatch( action.reset() )
console.log( store.getState() ) // { count: 0 }
```

