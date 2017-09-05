import findIndex from "lodash/findIndex"
import without from "lodash/without"
import isEqual from "lodash/isEqual"
import u from "updeep"
import createReducer from "../helpers/createReducer"
import {
  ARRAY_CHILD_ADDED,
  ARRAY_CHILD_CHANGED,
  ARRAY_CHILD_MOVED,
  ARRAY_CHILD_REMOVED,
  ARRAY_UPDATED,
  OBJECT_UPDATED,
  VALUE_REPLACED,
  INITIAL_VALUE_RECEIVED,
  INITIAL_FETCH_DONE,
  CONNECTED,
  USER_AUTHENTICATED,
  USER_UNAUTHENTICATED,
  CONFIG_UPDATED,
  ERROR_UPDATED,
  PROCESSING_UPDATED,
  COMPLETED_UPDATED,
  WRITE_PROCESSING_UPDATED,
  WRITE_ERRORS_UPDATED
} from "../actions/firebase"

function indexForKey(array, key) {
  return findIndex(array, element => element.key === key)
}

function arrayChildAdded(state, action) {
  const { payload: { path, value, previousChildKey } } = action
  const newArray = [...state.stores[path].value]
  const insertionIndex =
    previousChildKey === null
      ? newArray.length
      : indexForKey(newArray, previousChildKey) + 1

  newArray.splice(insertionIndex, 0, value)

  return u({ stores: { [path]: { value: newArray } } }, state)
}

function arrayChildChanged(state, action) {
  const { payload: { path, key, value } } = action
  const currentValue = state.stores[path] || {}

  // skip update if key isn't present in current array
  if (indexForKey(currentValue.value, key) === -1) {
    return state
  }

  return u.updateIn(
    `stores.${path}.value.${indexForKey(currentValue.value, key)}.value`,
    prev => (isEqual(prev, value.value) ? prev : value.value),
    state
  )
}

function arrayChildMoved(state, action) {
  const { payload: { path, key, previousChildKey } } = action
  const newArray = [...state.stores[path].value]
  const currentIndex = indexForKey(newArray, key)
  const record = newArray.splice(currentIndex, 1)[0]

  const insertionIndex =
    previousChildKey === null ? 0 : indexForKey(newArray, previousChildKey) + 1

  newArray.splice(insertionIndex, 0, record)

  return u({ stores: { [path]: { value: newArray } } }, state)
}

function arrayChildRemoved(state, action) {
  const { payload: { path, key } } = action
  const newArray = [...state.stores[path].value]
  newArray.splice(indexForKey(newArray, key), 1)

  return u({ stores: { [path]: { value: newArray } } }, state)
}

function valueReplaced(state, action) {
  const { payload: { path, value } } = action
  return u({ stores: { [path]: value } }, state)
}

function objectReplaced(state, action) {
  const { payload: { path, value } } = action

  // TODO:
  // investigate why firebase's .val() doesn't return new reference for object when nested object's key has been deleted
  return {
    ...state,
    stores: {
      ...state.stores,
      [path]: value
    }
  }
}

function initialValueReceived(state, action) {
  const { payload: { path } } = action
  return u({ initialValuesReceived: values => [...values, path] }, state)
}

function initialFetchDone(state) {
  return u({ initialFetchDone: true }, state)
}

function connected(state) {
  return u({ connected: true }, state)
}

function userAuthenticated(state, action) {
  return u({ authenticatedUser: action.payload }, state)
}

function userUnauthenticated(state) {
  return u({ authenticatedUser: null }, state)
}

function configUpdated(state, action) {
  const { payload: { name } } = action
  return u({ name: name }, state)
}

function updateError(state, action) {
  const { payload: { field, error } } = action
  return u({ errors: { [field]: error } }, state)
}

function updateProcessing(state, action) {
  const { payload: { field, value } } = action
  return u({ processing: { [field]: value } }, state)
}

function updateCompleted(state, action) {
  const { payload: { field, value } } = action
  return u({ completed: { [field]: value } }, state)
}

function updateWriteProcessing(state, action) {
  const { payload: { path, id, value } } = action
  const currentValue = state.writes.processing[path] || []
  const newValue = value ? [...currentValue, id] : without(currentValue, id)

  return u({ writes: { processing: { [path]: newValue } } }, state)
}

function updateWriteErrors(state, action) {
  const { payload: { path, error } } = action
  const currentValue = state.writes.errors[path] || []
  const newValue = error ? [...currentValue, error] : []

  return u({ writes: { errors: { [path]: newValue } } }, state)
}

export default function(bindings) {
  const initialStores = Object.keys(bindings).reduce((obj, path) => {
    obj[path] = null
    return obj
  }, {})

  const initialState = {
    authenticatedUser: null,
    connected: false,
    initialFetchDone: false,
    initialValuesReceived: [],
    stores: initialStores,
    name: null,
    errors: {
      permissions: null,
      login: null,
      createUser: null,
      resetPassword: null
    },
    processing: {
      login: false,
      createUser: false,
      resetPassword: false
    },
    completed: {
      login: false,
      createUser: false,
      resetPassword: false
    },
    writes: {
      processing: {},
      errors: {}
    }
  }

  return createReducer(initialState, {
    [ARRAY_CHILD_ADDED]: arrayChildAdded,
    [ARRAY_CHILD_CHANGED]: arrayChildChanged,
    [ARRAY_CHILD_MOVED]: arrayChildMoved,
    [ARRAY_CHILD_REMOVED]: arrayChildRemoved,
    [ARRAY_UPDATED]: valueReplaced,
    [OBJECT_UPDATED]: objectReplaced,
    [VALUE_REPLACED]: valueReplaced,
    [INITIAL_VALUE_RECEIVED]: initialValueReceived,
    [INITIAL_FETCH_DONE]: initialFetchDone,
    [CONNECTED]: connected,
    [USER_AUTHENTICATED]: userAuthenticated,
    [USER_UNAUTHENTICATED]: userUnauthenticated,
    [CONFIG_UPDATED]: configUpdated,
    [ERROR_UPDATED]: updateError,
    [PROCESSING_UPDATED]: updateProcessing,
    [COMPLETED_UPDATED]: updateCompleted,
    [WRITE_PROCESSING_UPDATED]: updateWriteProcessing,
    [WRITE_ERRORS_UPDATED]: updateWriteErrors
  })
}
