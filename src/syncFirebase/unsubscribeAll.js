import unsubscribe from "./unsubscribe"

export default function unsubscribeAll(state) {
  const { firebaseRefs } = state
  Object.keys(firebaseRefs).forEach(localBinding => {
    if (firebaseRefs.hasOwnProperty(localBinding)) {
      unsubscribe(state)(localBinding)
    }
  })
}
