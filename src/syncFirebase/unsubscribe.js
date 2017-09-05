import { replaceValue } from "../actions/firebase"

const unsubscribe = state => localBinding => {
  const { firebaseRefs, firebaseListeners, firebasePopulated, store } = state
  const ref = firebaseRefs[localBinding]
  const listeners = firebaseListeners[localBinding]
  const populated = firebasePopulated[localBinding]

  Object.keys(listeners).forEach(event => {
    if (listeners.hasOwnProperty(event)) {
      ref.off(event, listeners[event])
    }
  })

  // cancel change listeners for populated refs
  Object.keys(populated).forEach(key => {
    populated[key].ref.off("value", populated[key].listener)
  })

  // cleanup ref, listeners and populated
  delete firebaseRefs[localBinding]
  delete firebaseListeners[localBinding]
  delete firebasePopulated[localBinding]

  // reset store value to null
  store.dispatch(replaceValue(localBinding, null))
}

export default unsubscribe
