import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
import Login from '@/components/Login.vue'

const localVue = createLocalVue()
localVue.use(Vuex)

function createStore(overrides = {}) {
  return new Vuex.Store({
    state: {
      vuex_globalUser: '',
      vuex_isAuthenticated: false,
      ...overrides.state
    },
    mutations: {
      set_vuex_globalUser(state, user) { state.vuex_globalUser = user },
      set_vuex_isAuthenticated(state, bool) { state.vuex_isAuthenticated = bool },
      ...(overrides.mutations || {})
    }
  })
}

function createWrapper(store, routeOverrides = {}) {
  return shallowMount(Login, {
    localVue,
    store,
    mocks: {
      $route:  { query: {}, ...routeOverrides },
      $router: { push: jest.fn() }
    }
  })
}

describe('Login.vue', () => {
  let store

  beforeEach(() => {
    store = createStore()
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('renders username, password inputs and submit button', () => {
    const wrapper = createWrapper(store)
    const types = wrapper.findAll('input').wrappers.map(w => w.attributes('type'))
    expect(types).toContain('text')
    expect(types).toContain('password')
    expect(types).toContain('submit')
  })

  test('calls /Auth/Login on form submit', async () => {
    global.fetch.mockResolvedValue({ status: 200, json: async () => ({ username: 'testuser' }) })
    const wrapper = createWrapper(store)
    await wrapper.setData({ username: 'testuser', password: 'secret' })
    await wrapper.find('form').trigger('submit')
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(global.fetch).toHaveBeenCalledWith('/Auth/Login', expect.objectContaining({ method: 'POST' }))
  })

  test('on 200 response, commits to Vuex store', async () => {
    global.fetch.mockResolvedValue({ status: 200, json: async () => ({ username: 'testuser' }) })
    const commitSpy = jest.spyOn(store, 'commit')
    const wrapper = createWrapper(store)
    await wrapper.setData({ username: 'testuser', password: 'secret' })
    await wrapper.find('form').trigger('submit')
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(commitSpy).toHaveBeenCalledWith('set_vuex_globalUser', 'testuser')
    expect(commitSpy).toHaveBeenCalledWith('set_vuex_isAuthenticated', true)
  })

  test('on 200 response, redirects to /my-wish-list by default', async () => {
    global.fetch.mockResolvedValue({ status: 200, json: async () => ({ username: 'testuser' }) })
    const wrapper = createWrapper(store)
    await wrapper.setData({ username: 'testuser', password: 'secret' })
    await wrapper.find('form').trigger('submit')
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(wrapper.vm.$router.push).toHaveBeenCalledWith('/my-wish-list')
  })

  test('on 200 response, redirects to ?redirect path when present', async () => {
    global.fetch.mockResolvedValue({ status: 200, json: async () => ({ username: 'testuser' }) })
    const wrapper = createWrapper(store, { query: { redirect: '/profile' } })
    await wrapper.setData({ username: 'testuser', password: 'secret' })
    await wrapper.find('form').trigger('submit')
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(wrapper.vm.$router.push).toHaveBeenCalledWith('/profile')
  })

  test('on 401 response, shows inline error message without alert', async () => {
    global.fetch.mockResolvedValue({ status: 401, json: async () => ({ message: 'Invalid' }) })
    global.alert = jest.fn()
    const wrapper = createWrapper(store)
    await wrapper.setData({ username: 'bad', password: 'bad' })
    await wrapper.find('form').trigger('submit')
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(wrapper.find('.error-message').exists()).toBe(true)
    expect(wrapper.vm.error_message).toBe('Incorrect username or password.')
    expect(global.alert).not.toHaveBeenCalled()
  })

  test('on network error, shows inline error message', async () => {
    global.fetch.mockRejectedValue(new Error('Network failure'))
    const wrapper = createWrapper(store)
    await wrapper.setData({ username: 'testuser', password: 'secret' })
    await wrapper.find('form').trigger('submit')
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(wrapper.vm.error_message).toBe('Unable to connect. Please try again.')
  })

  test('typing clears the error message', async () => {
    const wrapper = createWrapper(store)
    await wrapper.setData({ error_message: 'Incorrect username or password.' })
    await wrapper.setData({ username: 'new' })
    expect(wrapper.vm.error_message).toBe('')
  })

  test('submit button is disabled while loading', async () => {
    global.fetch.mockReturnValue(new Promise(() => {})) // never resolves
    const wrapper = createWrapper(store)
    await wrapper.setData({ username: 'testuser', password: 'secret' })
    wrapper.find('form').trigger('submit')
    await localVue.nextTick()
    const btn = wrapper.find('input[type="submit"]')
    expect(btn.attributes('disabled')).toBeTruthy()
  })

  test('mounted with ?logout=true resets form and Vuex store', async () => {
    const loggedInStore = createStore({ state: { vuex_globalUser: 'testuser', vuex_isAuthenticated: true } })
    const commitSpy = jest.spyOn(loggedInStore, 'commit')
    shallowMount(Login, {
      localVue,
      store: loggedInStore,
      mocks: { $route: { query: { logout: 'true' } }, $router: { push: jest.fn() } }
    })
    await localVue.nextTick()
    expect(commitSpy).toHaveBeenCalledWith('set_vuex_globalUser', '')
    expect(commitSpy).toHaveBeenCalledWith('set_vuex_isAuthenticated', false)
  })
})
