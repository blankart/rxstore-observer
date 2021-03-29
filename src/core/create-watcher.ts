import { Action, ActionType, RxWatcher, WatchFunction } from "../types"

/**
 * Creates a new instance of watcher which can be
 * passed inside `store.addWatchers`
 * 
 * @param {ActionType<T>}type 
 * @param {WatchFunction<T>} watchFunction 
 */
const createWatcher = <
    T extends Action
>( 
    type: ActionType<T>, 
    watchFunction: WatchFunction<T> 
): RxWatcher<T>  => {
    return ( watchers, watchersListener ) => {
        watchers.push( { type, watchFunction } )
        watchersListener.next( watchers )
    }
}

export default createWatcher