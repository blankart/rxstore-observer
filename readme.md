# React RxJS Store

This project is currently in development.

### Usage:
```javascript
import { createRxjsStore } from 'react-rxjs-store'
import { mapTo } from 'rxjs/operators'

const initialState = {
    counter: 0
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

const store = createRxjsStore(reducer)

store.subscribe(currentState => {
    console.log('Current state: ', currentState) // { counter: 0, pinging: false }
})

dispatch({ type: 'INCREMENT' }) // { counter: 1, pinging: false }


// Create a watcher. 'PONG' will be dispatched everytime we dispatch 'PING' action.
store.addWatcher('PING', pipe => pipe(
    mapTo({ type: 'PONG' })
))

dispatch({ type: 'PING' })  // { counter: 1, pinging: true }
console.log('Current state: ', store.getState()) // { counter: 1, pinging: false }
```