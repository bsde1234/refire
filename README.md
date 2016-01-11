# Refire

> Quick prototyping with React, Firebase and Redux

Refire fetches selected [Firebase](https://www.firebase.com/) paths to your local [Redux](http://redux.js.org/) store and keeps your store in sync with Firebase.

You can also specify queries based on state and they will automatically get subscribed and unsubscribed when state changes.

Using provided [React](https://facebook.github.io/react/) higher-order components and [React Redux](https://github.com/rackt/react-redux) helper you also get automatic re-renders for your connected views on any change.

All mutation still happens through [Firebase client's](https://www.firebase.com/docs/web/api/firebase) `references`.

## syncFirebase({store, url, bindings, onCancel, onAuth})

syncFirebase needs bindings, a Redux store instance and a Firebase instance url.

`bindings` bindings define the sync options per firebase path. See the comments below in usage example for more info.

`store` is your Redux store instance, remember to include `firebaseReducer` in your Redux reducer function, see the usage example below.

`url` is your firebase instance's url (don't forget the trailing slash).

`onAuth` (optional) gets called after Firebase's authentication state changes.

`onCancel` (optional) gets called whenever reading data fails, e.g. client doesn't have needed read permissions.

### Usage example
```javascript
import { applyMiddleware, createStore, compose, combineReducers } from 'redux'
import thunk from 'redux-thunk'
import { firebaseReducer, syncFirebase } from 'redux-firebase-sync'

const firebaseBindings = {
  // Primitives can be defined without setting any type, just set the local sync path
  // as key and object containing remote path as value.
  localCounter: {
    path: "counterPathInFirebase"
  },
  // Objects can be defined by setting the type as "Object"
  localObject: {
    type: "Object",
    path: "objectPathInFirebase"
  },
  // Arrays can be defined by setting the type as "Array"
  // You can also define query, it will fetch the initial values
  // with given reference params and also keep your binding live on any changes
  localArray: {
    type: "Array",
    path: "arrayPathInFirebase",
    query: ref => ref.orderByChild("timestamp")
  },
  // If you want to react to state changes, you can define the path dynamically
  // by setting the path as function.
  // In this example user path would be populated with user data when user logs in
  // and automatically cleared when user logs out.
  user: {
    type: "Object",
    path: state => {
      if (state.firebase.authenticatedUser) {
        return `users/${state.firebase.authenticatedUser.uid}`
      } else {
        return null
      }
    }
  }
}

const reducer = combineReducers({
  firebase: firebaseReducer(firebaseBindings),
  // your other reducers
})
const store = compose(applyMiddleware(thunk))(createStore)(reducer)

const {unsubscribe} = syncFirebase({
  store: store,
  url: "https://your-firebase-instance.firebaseio.com/",
  bindings: firebaseBindings,
  onAuth: (authData) => {},
  onCancel: (error) => {}
})
```

## React Redux connect helper

### firebaseToProps(localBindings, mapStateToProps)

Creates selector function for [react-redux's connect](https://github.com/rackt/react-redux/blob/master/docs/api.md#connectmapstatetoprops-mapdispatchtoprops-mergeprops-options).

firebaseToProps will return the content of your given local bindings (array) as props.

If you also need to return something else from Redux, pass your normal mapStateToProps as second parameter, firebaseToProps will merge the results.

```javascript
@connect(
  firebaseToProps(["counter"])
)
class Counter extends Component {
  render() {
    // counter available as this.props.counter
  }
}
```

There's also special `_status` binding available, it provides an object with latest `authenticatedUser`, `connected`, `errors` and `initialFetchDone` values.

```javascript
@connect(firebaseToProps(["_status"]))
class App extends Component {

  render() {
    const { _status: status } = this.props
    const connected = status.connected && status.initialFetchDone

    if (!connected) {
      return (
        <div>Loading...</div>
      )
    } else {
      // firebase connected & all initial fetches done
    }
  }
}
```

## React components

These higher-order components will help you with basic Firebase tasks.

**FirebaseOAuth** does not work with [React Native](https://facebook.github.io/react-native/) yet as it requires browser redirects or popups. It might be possible to add React Native version later as WebView component is now available for both iOS & Android.

### FirebaseLogin

TODO

### FirebaseOAuth

TODO

### FirebaseRegistration

TODO

### FirebaseResetPassword

TODO

### FirebaseWrite

TODO


## Data shape

All returned values are wrapped in `{key, value}` shaped object for easier consumption.

Primitives and Objects could be returned as they are, but then consumption of Array elements would be different, it's easier to have uniform way to access keys and values.

I'm also not a big fan of `.key` and `.value` used in [ReactFire](https://github.com/firebase/reactfire).

### Usage example using ES6 destructuring assignment
```javascript
// Primitives
// {key: "counter", value: 1}
const {value: counter} = this.props.counter

// Objects
// {key: "project", value: {title: "Cool"}}
const {value: project} = this.props.project

// Arrays
// {key: "projects", value: [{key: "-K1XY-B3ZR...", value: {title: "redux-firebase-sync"}}]}
const {value: projects} = this.props.projects
projects.map(record => {
  const {key: id, value: project} = record
  return <li key={id}>{project.title}</li>
})
```
