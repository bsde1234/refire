import subscribeFirebase from "./subscribeFirebase"

const subscribe = (state, currentOptions, onCancel) => localBinding => {
  const {
    firebaseRefs,
    firebaseListeners,
    firebasePopulated,
    store,
    appName
  } = state

  const {
    ref,
    listeners,
    populated
  } = subscribeFirebase(localBinding, currentOptions[localBinding], {
    store,
    onCancel,
    name: appName
  })
  firebaseRefs[localBinding] = ref
  firebaseListeners[localBinding] = listeners
  firebasePopulated[localBinding] = populated
}

export default subscribe
