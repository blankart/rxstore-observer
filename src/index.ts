export { createRxStore, applyMiddleware, createWatcher } from './core'
export { 
    RxStore,
    WatchFunction,
    SubscribeFunction,
    Action,
    ActionType,
    RxStoreMiddleware,
    RxReducer,
    WatchListener,
} from './types'

export {
    fromState
} from './operators'