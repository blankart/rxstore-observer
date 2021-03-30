export { createRxStore, applyMiddleware, createWatcher, combineReducers } from './core'
export { 
    RxStore,
    WatchFunction,
    SubscribeFunction,
    Action,
    ActionType,
    RxStoreMiddleware,
    RxReducer,
    WatchListener,
    RxWatcher,
    RxDispatch,
    RxReducersMapObject,
    StateFromReducersMapObject
} from './types'

export {
    fromState
} from './operators'