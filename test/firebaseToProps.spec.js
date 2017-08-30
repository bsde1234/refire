/* eslint-env node, mocha */
import expect from 'expect'
import get from 'lodash/get'
import { firebaseToProps } from '../src/index'
import {
  initSync,
  incrementCounter
} from './helpers'

describe('firebaseToProps selector', () => {
  let server
  let unsubscribe

	afterEach(function () {
		if (server) {
			server.close()
			server = null
		}
    if (unsubscribe) {
      unsubscribe()
    }
	})

  it('should provide _status', async () => {
    let initialized, store, name

    ({initialized, server, unsubscribe, store, name} = initSync({
      bindings: {},
      data: {}
    }))

    await initialized
    const props = firebaseToProps(["_status"])(store.getState())
    expect(props._status).toEqual({
      authenticatedUser: null,
      connected: true,
      initialFetchDone: true,
      name: name,
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
        errors: {},
        processing: {}
      }
    })
  })

  it('should map primitives as props', async () => {
    let initialized, store
    ({initialized, server, unsubscribe, store} = initSync({
      bindings: {counter: {path: "counter"}},
      data: {counter: 5}
    }))

    await initialized
    const props = firebaseToProps(["counter"])(store.getState())
    expect(props.counter).toEqual({ key: 'counter', value: 5 })
  })

  it('should map arrays as props', async () => {
    let initialized, store
    ({initialized, server, unsubscribe, store} = initSync({
      bindings: {
        posts: {
          type: "Array",
          path: "posts"
        }
      },
      data: {
        posts: {
          "first": {id: 1, title: "Hello", body: "World"}
        }
      }
    }))

    await initialized
    const props = firebaseToProps(["posts"])(store.getState())
    expect(props.posts).toEqual({
      key: 'posts',
      value: [
        {
          key: 'first',
          value: {
            body: 'World',
            id: 1,
            title: 'Hello'
          }
        }
      ]
    })
  })

  it('should map objects as props', async () => {
    let initialized, store
    ({initialized, server, unsubscribe, store} = initSync({
      bindings: { user: {type: "Object", path: "user"} },
      data: { user: {name: "Test user", email: "test@test.dev"} }
    }))

    await initialized
    const props = firebaseToProps(["user"])(store.getState())
    expect(props.user).toEqual({
      key: "user",
      value: {name: "Test user", email: "test@test.dev"}
    })
  })

  it('should map prop as null if unsubscribed', async () => {
    let initialized, store
    ({initialized, server, unsubscribe, store} = initSync({
      bindings: {
        user: {
          type: "Object",
          path: state => {
            if (state.counter === 1) {
              return "user"
            } else {
              return null
            }
          }
        }
      },
      data: { user: {name: "Test user", email: "test@test.dev"} }
    }))

    await initialized
    const props = firebaseToProps(["user"])(store.getState())
    expect(props.user).toEqual({
      key: "user",
      value: {name: "Test user", email: "test@test.dev"}
    })

    store.dispatch(incrementCounter())
    const nextProps = firebaseToProps(["user"])(store.getState())
    expect(nextProps.user).toEqual(null)
  })

  it('should map prop value if subscribed', async (done) => {
    let initialized, store
    ({initialized, server, unsubscribe, store} = initSync({
      bindings: {
        user: {
          type: "Object",
          path: state => {
            if (state.counter === 1) {
              return null
            } else {
              return "user"
            }
          }
        }
      },
      data: { user: {name: "Test user", email: "test@test.dev"} }
    }))

    await initialized

    const props = firebaseToProps(["user"])(store.getState())
    expect(props.user).toEqual(null)

    store.dispatch(incrementCounter())

    const unsub = store.subscribe(() => {
      const state = get(store.getState(), 'firebase.stores.user')
      const props = firebaseToProps(["user"])(store.getState())
      if (state && state.value !== null) {
        expect(props.user).toEqual({
          key: "user",
          value: {name: "Test user", email: "test@test.dev"}
        })
        unsub()
        done()
      }
    })
  })

  it('should map correct value if unsubscribed & resubscribed', async (done) => {
    let initialized, store
    ({initialized, server, unsubscribe, store} = initSync({
      bindings: {
        user: {
          type: "Object",
          path: state => {
            if (state.counter === 1) {
              return "users/1"
            } else {
              return "users/2"
            }
          }
        }
      },
      data: {
        users: {
          1: {
            name: "First user", email: "first@test.dev"
          },
          2: {
            name: "Second user", email: "second@test.dev"
          }
        }
      }
    }))

    await initialized
    const props = firebaseToProps(["user"])(store.getState())
    expect(props.user).toEqual({
      key: "1",
      value: {name: "First user", email: "first@test.dev"}
    })

    store.dispatch(incrementCounter())

    const unsub = store.subscribe(() => {
      const state = get(store.getState(), 'firebase.stores.user')
      const props = firebaseToProps(["user"])(store.getState())
      if (state && state.value !== null) {
        expect(props.user).toEqual({
          key: "2",
          value: {name: "Second user", email: "second@test.dev"}
        })
        unsub()
        done()
      }
    })
  })

})
