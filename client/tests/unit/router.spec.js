import Vue from 'vue'
import VueRouter from 'vue-router'

// Mock fetch globally
global.fetch = jest.fn()

// We need to test the router's beforeEach guard.
// The router imports the real vuex_store, so we mock it.
jest.mock('@/vuex_store.js', () => ({
  state: {
    vuex_isAuthenticated: false,
    sessionValidatedAt:   0,
  },
  dispatch: jest.fn(),
}))

// Import the mock store reference so we can change it per test
const mockStore = require('@/vuex_store.js')

// Also mock the component imports to avoid loading their dependencies
jest.mock('@/components/Content/WishxlistHome.vue',  () => ({ render: h => h('div') }))
jest.mock('@/components/Content/AboutWishxlist.vue', () => ({ render: h => h('div') }))
jest.mock('@/components/Content/ShareTheMeal.vue',   () => ({ render: h => h('div') }))
jest.mock('@/components/Wish/MyWishList.vue',        () => ({ render: h => h('div') }))
jest.mock('@/components/Wish/GroupWishLists.vue',    () => ({ render: h => h('div') }))
jest.mock('@/components/Login.vue',                  () => ({ render: h => h('div') }))
jest.mock('@/components/Profile.vue',                () => ({ render: h => h('div') }))
jest.mock('@/components/Content/Groups.vue',         () => ({ render: h => h('div') }))

const SESSION_TTL_MS = 2 * 60 * 1000  // 2 minutes — must match router.js

describe('router.js auth guard', () => {
  let router

  beforeEach(() => {
    // Reset auth state before each test
    jest.clearAllMocks()
    mockStore.state.vuex_isAuthenticated = false
    mockStore.state.sessionValidatedAt   = 0
    mockStore.dispatch.mockResolvedValue()
    // Clear module cache so router re-evaluates with current mock store
    jest.resetModules()
    // Re-apply store mock after resetModules (component mocks persist from top level)
    jest.mock('@/vuex_store.js', () => mockStore)
    router = require('@/router.js').default
  })

  describe('when not authenticated', () => {
    test('navigating to /my-wish-list redirects to /login', done => {
      mockStore.state.vuex_isAuthenticated = false
      router.push('/my-wish-list').catch(() => {})
      router.onReady(() => {
        router.beforeEach((to, from, next) => { next() })
      })
      // Use router.push and check where we end up
      const router2 = require('@/router.js').default
      router2.push('/my-wish-list').catch(() => {})
      setTimeout(() => {
        expect(router2.currentRoute.path).toBe('/login')
        done()
      }, 50)
    })

    test('navigating to /group-wish-lists redirects to /login', done => {
      mockStore.state.vuex_isAuthenticated = false
      const r = require('@/router.js').default
      r.push('/group-wish-lists').catch(() => {})
      setTimeout(() => {
        expect(r.currentRoute.path).toBe('/login')
        done()
      }, 50)
    })

    test('navigating to /groups redirects to /login', done => {
      mockStore.state.vuex_isAuthenticated = false
      const r = require('@/router.js').default
      r.push('/groups').catch(() => {})
      setTimeout(() => {
        expect(r.currentRoute.path).toBe('/login')
        done()
      }, 50)
    })

    test('navigating to /profile redirects to /login', done => {
      mockStore.state.vuex_isAuthenticated = false
      const r = require('@/router.js').default
      r.push('/profile').catch(() => {})
      setTimeout(() => {
        expect(r.currentRoute.path).toBe('/login')
        done()
      }, 50)
    })

    test('public route / is accessible when not authenticated', done => {
      mockStore.state.vuex_isAuthenticated = false
      const r = require('@/router.js').default
      r.push('/').catch(() => {})
      setTimeout(() => {
        expect(r.currentRoute.path).toBe('/')
        expect(mockStore.dispatch).not.toHaveBeenCalled()
        done()
      }, 50)
    })

    test('public route /about is accessible when not authenticated', done => {
      mockStore.state.vuex_isAuthenticated = false
      const r = require('@/router.js').default
      r.push('/about').catch(() => {})
      setTimeout(() => {
        expect(r.currentRoute.path).toBe('/about')
        expect(mockStore.dispatch).not.toHaveBeenCalled()
        done()
      }, 50)
    })

    test('public route /login is accessible when not authenticated', done => {
      mockStore.state.vuex_isAuthenticated = false
      const r = require('@/router.js').default
      r.push('/login').catch(() => {})
      setTimeout(() => {
        expect(r.currentRoute.path).toBe('/login')
        expect(mockStore.dispatch).not.toHaveBeenCalled()
        done()
      }, 50)
    })
  })

  describe('session re-validation on protected routes', () => {
    test('validates session when sessionValidatedAt is 0 (never validated)', done => {
      mockStore.state.vuex_isAuthenticated = true
      mockStore.state.sessionValidatedAt   = 0
      mockStore.dispatch.mockImplementation(() => {
        mockStore.state.vuex_isAuthenticated = true
        return Promise.resolve()
      })
      const r = require('@/router.js').default
      r.push('/my-wish-list').catch(() => {})
      setTimeout(() => {
        expect(mockStore.dispatch).toHaveBeenCalledWith('fetchCurrentUser')
        expect(r.currentRoute.path).toBe('/my-wish-list')
        done()
      }, 100)
    })

    test('validates session when last check was more than 2 minutes ago', done => {
      mockStore.state.vuex_isAuthenticated = true
      mockStore.state.sessionValidatedAt   = Date.now() - SESSION_TTL_MS - 1
      mockStore.dispatch.mockImplementation(() => {
        mockStore.state.vuex_isAuthenticated = true
        return Promise.resolve()
      })
      const r = require('@/router.js').default
      r.push('/my-wish-list').catch(() => {})
      setTimeout(() => {
        expect(mockStore.dispatch).toHaveBeenCalledWith('fetchCurrentUser')
        expect(r.currentRoute.path).toBe('/my-wish-list')
        done()
      }, 100)
    })

    test('redirects to /login when server session has expired', done => {
      mockStore.state.vuex_isAuthenticated = true
      mockStore.state.sessionValidatedAt   = 0
      mockStore.dispatch.mockImplementation(() => {
        // Simulate 401 — fetchCurrentUser clears auth state
        mockStore.state.vuex_isAuthenticated = false
        return Promise.resolve()
      })
      const r = require('@/router.js').default
      r.push('/my-wish-list').catch(() => {})
      setTimeout(() => {
        expect(mockStore.dispatch).toHaveBeenCalledWith('fetchCurrentUser')
        expect(r.currentRoute.path).toBe('/login')
        done()
      }, 100)
    })

    test('skips server validation when session was checked within 2 minutes', done => {
      mockStore.state.vuex_isAuthenticated = true
      mockStore.state.sessionValidatedAt   = Date.now()  // just validated
      const r = require('@/router.js').default
      r.push('/my-wish-list').catch(() => {})
      setTimeout(() => {
        expect(mockStore.dispatch).not.toHaveBeenCalled()
        expect(r.currentRoute.path).toBe('/my-wish-list')
        done()
      }, 50)
    })
  })
})
