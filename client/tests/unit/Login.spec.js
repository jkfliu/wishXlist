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
    sessionStorage.clear()
  })

  afterEach(() => {
    sessionStorage.clear()
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

  test('?logout=true dispatches logout action and shows logout message', async () => {
    const loggedInStore = createStore('jkfliu@gmail.com', true)
    const dispatchSpy = jest.spyOn(loggedInStore, 'dispatch')
    const wrapper = createWrapper(loggedInStore, { logout: 'true' })
    await wrapper.vm.$nextTick()
    expect(dispatchSpy).toHaveBeenCalledWith('logout')
    expect(wrapper.find('.info-message').exists()).toBe(true)
    expect(wrapper.vm.message).toContain('logged out')
  })

  test('?oauth_success dispatches fetchCurrentUser and redirects to /my-wish-list', async () => {
    const dispatchSpy = jest.spyOn(store, 'dispatch')
    const wrapper = createWrapper(store, { oauth_success: '1' })
    await wrapper.vm.$nextTick()
    expect(dispatchSpy).toHaveBeenCalledWith('fetchCurrentUser')
    expect(wrapper.vm.$router.push).toHaveBeenCalledWith('/my-wish-list')
  })

  test('?redirect saves destination to sessionStorage for after OAuth', () => {
    createWrapper(store, { redirect: '/groups?join=DDC25752' })
    expect(sessionStorage.getItem('postLoginRedirect')).toBe('/groups?join=DDC25752')
  })

  test('?oauth_success redirects to sessionStorage destination and clears it', async () => {
    sessionStorage.setItem('postLoginRedirect', '/groups?join=DDC25752')
    const wrapper = createWrapper(store, { oauth_success: '1' })
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.$router.push).toHaveBeenCalledWith('/groups?join=DDC25752')
    expect(sessionStorage.getItem('postLoginRedirect')).toBeNull()
  })

  test('?oauth_success falls back to /my-wish-list when no sessionStorage redirect', async () => {
    const wrapper = createWrapper(store, { oauth_success: '1' })
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.$router.push).toHaveBeenCalledWith('/my-wish-list')
  })

  test('?error=oauth_failed shows error message', async () => {
    const wrapper = createWrapper(store, { error: 'oauth_failed' })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.error-message').exists()).toBe(true)
    expect(wrapper.vm.error_message).toContain('Sign-in failed')
  })
})
