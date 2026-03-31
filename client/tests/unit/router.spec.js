import Vue from 'vue'
import VueRouter from 'vue-router'

// We need to test the router's beforeEach guard.
// The router imports the real vuex_store, so we mock it.
jest.mock('@/vuex_store.js', () => ({
  state: {
    vuex_isAuthenticated: false
  }
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

describe('router.js auth guard', () => {
  let router

  beforeEach(() => {
    // Reset auth state before each test
    mockStore.state.vuex_isAuthenticated = false
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
        done()
      }, 50)
    })

    test('public route /about is accessible when not authenticated', done => {
      mockStore.state.vuex_isAuthenticated = false
      const r = require('@/router.js').default
      r.push('/about').catch(() => {})
      setTimeout(() => {
        expect(r.currentRoute.path).toBe('/about')
        done()
      }, 50)
    })

    test('public route /login is accessible when not authenticated', done => {
      mockStore.state.vuex_isAuthenticated = false
      const r = require('@/router.js').default
      r.push('/login').catch(() => {})
      setTimeout(() => {
        expect(r.currentRoute.path).toBe('/login')
        done()
      }, 50)
    })
  })
})
