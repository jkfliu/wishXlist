import { shallowMount } from '@vue/test-utils'
import Login from '@/components/Login.vue'
import { localVue, createStore } from './helpers'

function createWrapper(store, query = {}) {
  return shallowMount(Login, {
    localVue,
    store,
    mocks: {
      $route:  { query },
      $router: { push: jest.fn() },
    }
  })
}

describe('Login.vue', () => {
  let store

  beforeEach(() => {
    store = createStore('', false)
  })

  test('renders Sign in with Google link', () => {
    const wrapper = createWrapper(store)
    expect(wrapper.find('a.google-btn').exists()).toBe(true)
    expect(wrapper.find('a.google-btn').text()).toContain('Sign in with Google')
  })

  test('default state shows no message or error', () => {
    const wrapper = createWrapper(store)
    expect(wrapper.find('.info-message').exists()).toBe(false)
    expect(wrapper.find('.error-message').exists()).toBe(false)
  })

  test('?logout=true clears Vuex store and shows logout message', async () => {
    const loggedInStore = createStore('jkfliu@gmail.com', true)
    const commitSpy = jest.spyOn(loggedInStore, 'commit')
    const wrapper = createWrapper(loggedInStore, { logout: 'true' })
    await wrapper.vm.$nextTick()
    expect(commitSpy).toHaveBeenCalledWith('set_vuex_globalUser', '')
    expect(commitSpy).toHaveBeenCalledWith('set_vuex_isAuthenticated', false)
    expect(wrapper.find('.info-message').exists()).toBe(true)
    expect(wrapper.vm.message).toContain('logged out')
  })

  test('?oauth_username commits email to store and redirects to /my-wish-list', () => {
    const commitSpy = jest.spyOn(store, 'commit')
    const wrapper = createWrapper(store, { oauth_username: 'jkfliu%40gmail.com' })
    expect(commitSpy).toHaveBeenCalledWith('set_vuex_globalUser', 'jkfliu@gmail.com')
    expect(commitSpy).toHaveBeenCalledWith('set_vuex_isAuthenticated', true)
    expect(wrapper.vm.$router.push).toHaveBeenCalledWith('/my-wish-list')
  })

  test('?oauth_username with ?redirect uses the redirect path', () => {
    const wrapper = createWrapper(store, { oauth_username: 'jkfliu%40gmail.com', redirect: '/profile' })
    expect(wrapper.vm.$router.push).toHaveBeenCalledWith('/profile')
  })

  test('?error=oauth_failed shows error message', async () => {
    const wrapper = createWrapper(store, { error: 'oauth_failed' })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.error-message').exists()).toBe(true)
    expect(wrapper.vm.error_message).toContain('Sign-in failed')
  })
})
