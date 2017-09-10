import firebase from "firebase"
import isEqual from "lodash/isEqual"
import difference from "lodash/difference"
import intersection from "lodash/intersection"

import {
  receiveInitialValue,
  completeInitialFetch,
  connect,
  authenticateUser,
  unauthenticateUser,
  updateConfig,
  revokePermissions
} from "./actions/firebase"

import createOptions from "./syncFirebase/createOptions"
import subscribe from "./syncFirebase/subscribe"
import unsubscribe from "./syncFirebase/unsubscribe"
import unsubscribeAll from "./syncFirebase/unsubscribeAll"

export default function syncFirebase(options = {}) {
  const {
    apiKey,
    store,
    projectId,
    databaseURL,
    name = "[DEFAULT]",
    bindings = {},
    onCancel = () => {},
    onAuth,
    pathParams
  } = options

  if (typeof store === "undefined") {
    throw new Error("syncFirebase: Redux store reference not found in options")
  }

  if (typeof projectId === "undefined") {
    throw new Error("syncFirebase: projectId not found in options")
  }

  if (typeof apiKey === "undefined") {
    throw new Error("syncFirebase: apiKey not found in options")
  }

  if (typeof url !== "undefined") {
    throw new Error(
      "syncFirebase: url is deprecated in options, use projectId & apiKey instead"
    )
  }

  const config = {
    apiKey: apiKey,
    authDomain: `${projectId}.firebaseapp.com`,
    databaseURL: databaseURL
      ? databaseURL
      : `https://${projectId}.firebaseio.com`,
    storageBucket: `${projectId}.appspot.com`
  }

  store.dispatch(updateConfig({ name: name }))

  const app = firebase.initializeApp(config, name)
  const rootRef = firebase.database(app).ref()

  const state = {
    appName: name,
    projectId,
    store,
    pathParams,
    firebaseRefs: {},
    firebaseListeners: {},
    firebasePopulated: {},
    bindings
  }

  let currentOptions = createOptions(state)

  function updateSubscriptions() {
    const previousOptions = { ...currentOptions }
    const nextOptions = createOptions(state)

    if (!isEqual(currentOptions, nextOptions)) {
      const nextOptionsKeys = Object.keys(nextOptions)
      const currentOptionsKeys = Object.keys(currentOptions)

      const subscribed = difference(nextOptionsKeys, currentOptionsKeys)
      const unsubscribed = difference(currentOptionsKeys, nextOptionsKeys)
      const remaining = intersection(currentOptionsKeys, nextOptionsKeys)

      // update currentOptions as we're done with comparisons
      currentOptions = nextOptions

      // unsubscribe removed bindings
      unsubscribed.forEach(unsubscribe(state))

      // subscribe new bindings
      subscribed.forEach(subscribe(state, currentOptions, onCancel))

      // check if subscription paths or queries have changed
      remaining.forEach(localBinding => {
        if (
          !isEqual(
            currentOptions[localBinding].path,
            previousOptions[localBinding].path
          ) ||
          !isEqual(
            currentOptions[localBinding].queryState,
            previousOptions[localBinding].queryState
          )
        ) {
          unsubscribe(state)(localBinding)

          // resubscribe with new path / query
          subscribe(state, currentOptions, onCancel)(localBinding)
        }
      })
    }
  }

  store.subscribe(updateSubscriptions)

  firebase
    .database(app)
    .ref(".info/connected")
    .on(
      "value",
      snapshot => {
        if (snapshot.val() === true) {
          store.dispatch(connect())
        }
      },
      revokePermissions
    )

  // we need to check for existence of onAuthStateChanged as node version doesn't include it
  if (
    firebase.auth(app) &&
    typeof firebase.auth(app).onAuthStateChanged === "function"
  ) {
    firebase.auth(app).onAuthStateChanged(function(authData) {
      // TODO: decide proper user data format
      // current format is like this for backwards compatibility with 1.x
      const user = authData
        ? { ...authData.providerData[0], uid: authData.uid }
        : null
      if (user) {
        store.dispatch(authenticateUser(user))
      } else {
        store.dispatch(unauthenticateUser())
      }
      if (onAuth && typeof onAuth === "function") {
        onAuth(user, rootRef)
      }
    })
  }

  // initial subscriptions
  Object.keys(currentOptions).forEach(
    subscribe(state, currentOptions, onCancel)
  )

  // resolve initialized promise when firebase connection has been established
  // and initial fetch has been marked as done
  const initialized = new Promise(resolve => {
    const unsub = store.subscribe(() => {
      const { firebase } = store.getState()
      if (firebase.connected && firebase.initialFetchDone) {
        resolve()
        unsub()
      }
    })
  })

  // immediately mark initial fetch completed if we aren't initially subscribed to any stores
  if (!Object.keys(currentOptions).length) {
    store.dispatch(completeInitialFetch())
  }

  // mark initial values received for stores that don't have initial value
  difference(
    Object.keys(bindings),
    Object.keys(currentOptions)
  ).forEach(localBinding => {
    store.dispatch(receiveInitialValue(localBinding))
  })

  return Object.defineProperties(
    {
      unsubscribe: () => unsubscribeAll(state),
      addBinding: binding => {
        const { name, ...rest } = binding
        if (name) {
          bindings[name] = rest
          // run subscription checks manually as we've added new binding
          updateSubscriptions()
        }
      },
      removeBinding: name => {
        if (bindings[name]) {
          delete bindings[name]
          // run subscription checks manually as we've deleted binding
          updateSubscriptions()
        }
      },
      updateBinding: binding => {
        const { name, ...updatedProps } = binding
        if (bindings[name]) {
          bindings[name] = { ...bindings[name], ...updatedProps }
          // run subscription checks manually as we've updated binding
          updateSubscriptions()
        }
      }
    },
    {
      refs: {
        enumerable: false,
        writable: false,
        value: state.firebaseRefs
      },
      listeners: {
        enumerable: false,
        writable: false,
        value: state.firebaseListeners
      },
      populated: {
        enumerable: false,
        writable: false,
        value: state.firebasePopulated
      },
      initialized: {
        enumerable: false,
        writable: false,
        value: initialized
      }
    }
  )
}
