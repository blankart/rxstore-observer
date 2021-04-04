## Firebase Observer Recipe (Advanced)

This recipe can be used for creating a simple chat application using firebase.

`ChatObservers.ts`
```typescript
import { from, Observable } from "rxjs"
import { Observer, RxDispatch } from "rxstore-observer"
import { switchMap, tap, map, mapTo } from "rxjs/operators"

import { myFirebase } from "#config"
import { Store, Actions, Chat } from "#types"
import { SendMessageAction, setChats, setIsSendingMessage, SetIsWatchingChatsAction, setLoadingChat } from "./actions"
import * as Constants from "./contants"
import { fetchChats as fetchChatsResolver, sendMessage as sendMessageResolver } from './resolvers'
import { parseChat } from "./util"

export class ChatObservers {
    @Observer<Store, Action>( Constants.FETCH_CHATS )
    fetchChatsHandler( $action: Observable<T>, _: () => Store, dispatch: RxDispatch<T> ) {
        return $action.pipe(
            tap( () => dispatch( setLoadingChat( true ) ) ),
            switchMap( () => from( fetchChatsResolver() ) ),
            map( chats => {
                if ( chats ) {
                    dispatch( setChats( chats ) )
                }
                return setLoadingChat( false )
            } )
        )
    }

    @Observer<Store, Action>( Constants.SEND_MESSAGE )
    sendMessageHandler( $action: Observable<T>, _: () => Store, dispatch: RxDispatch<T> ) {
        return $action.pipe(
            tap( () => dispatch( setIsSendingMessage( true ) ) ),
            switchMap( action => from( sendMessageResolver( ( action as SendMessageAction ).payload ) ) ),
            mapTo( setIsSendingMessage( false ) )
        )
    }

    @Observer<Store, Action>( Constants.SUBSCRIBE_TO_CHATS )
    syncChatsHandler( $action: Observable<T>, _: () => Store, dispatch: RxDispatch<T> ) {
        /**
         * Create a new subscription using firebase. 
        */
        let subscription: () => void | undefined
        const subscribe = () => {
            subscription = myFirebase.firestore().collection( 'Chats' ).onSnapshot( data => {
                const chats: Chat[] = []
                data.docs.forEach( doc => {
                    chats.push( parseChat( doc.data() ) )
                } )

                chats.sort( ( a,b ) => {
                    const aDate = new Date( a.timestamp as string )
                    const bDate = new Date( b.timestamp as string )
                    return aDate.getTime() > bDate.getTime() ? 1 : - 1
                } )

                dispatch( setChats( chats ) )
            } )
        }

        const unsubscribe = () => {
            subscription()
            subscription  = undefined as unknown as () => void | undefined
        }

        return $action.pipe(
            tap( action => {
                if ( ( action as SetIsWatchingChatsAction ).payload && ! subscription ) {
                    subscribe()
                    return
                }

                if ( ! ( action as SetIsWatchingChatsAction ).payload && subscription ) {
                    unsubscribe()
                    return
                }
            } ),
            mapTo( undefined )
        )
    }
}

```

`store.ts`
```typescript
import { ChatObservers } from './ChatObservers'
import { createRxStore } from 'rxstore-observer'
import chatReducer from './reducer'

const store = createRxStore( chatReducer )
store.addObservers( [ ChatObservers ] )

```