# RxStore Observer

A state management tool using RxJS

This project is currently in development.

### Usage:
```javascript
import { createRxStore, applyMiddleware } from 'rxstore-observer'
import { mapTo } from 'rxjs/operators'

const initialState = {
    counter: 0,
    pinging: false
}

const reducer = (state = initialState, action) => {
    switch (action.type) {
        case 'INCREMENT': return { ...state, counter: state.counter + 1 }
        case 'DECREMENT': return { ...state, counter: state.counter - 1 }
        case 'PING': return { ...state, pinging: true }
        case 'PONG': return { ...state, pinging: false }
        default: return state
    }
}

// Any redux middlewares should work just fine!
const store = createRxStore(reducer, initialState, applyMiddleware(yourAwesomeMiddleware))

store.subscribe(() => {
    console.log('Current state: ', store.getState()) // { counter: 0, pinging: false }
})

store.dispatch({ type: 'INCREMENT' }) // { counter: 1, pinging: false }


// Create an observer. 'PONG' will be dispatched everytime we dispatch 'PING' action.
store.addObserver('PING', pipe => pipe(
    mapTo({ type: 'PONG' })
))

store.dispatch({ type: 'PING' })  // { counter: 1, pinging: true }
console.log('Current state: ', store.getState()) // { counter: 1, pinging: false }
```