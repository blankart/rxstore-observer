export interface State {
    dummyField1: string,
    dummyField2: string,
    dummyField3: string
}

export const initialState: State = {
    dummyField1: '',
    dummyField2: '',
    dummyField3: '',
}

export type ActionMethods = {
    changeDummyField1: ( a: string ) => void
    changeDummyField2: ( a: string ) => void
    changeDummyField3: ( a: string ) => void
    nothingMethod: () => void
}

export type Types = "CHANGE_DUMMY_FIELD_1" | "CHANGE_DUMMY_FIELD_2" | "CHANGE_DUMMY_FIELD_3"

export interface ChangeDummyField1Action {
    type: 'CHANGE_DUMMY_FIELD_1',
    payload: string,
}

export interface ChangeDummyField2Action {
    type: 'CHANGE_DUMMY_FIELD_2',
    payload: string,
}

export interface ChangeDummyField3Action {
    type: 'CHANGE_DUMMY_FIELD_3',
    payload: string,
}

export type Action = ChangeDummyField1Action | ChangeDummyField2Action | ChangeDummyField3Action


export const reducer = ( state: State = initialState, action: Action ): State => {
    switch ( action.type ) {
    case "CHANGE_DUMMY_FIELD_1": {
        return {
            ...state,
            dummyField1: action.payload
        }
    }
    case "CHANGE_DUMMY_FIELD_2": {
        return {
            ...state,
            dummyField2: action.payload
        }
    }
    case "CHANGE_DUMMY_FIELD_3": {
        return {
            ...state,
            dummyField3: action.payload
        }
    }
    default: return state
    }
}