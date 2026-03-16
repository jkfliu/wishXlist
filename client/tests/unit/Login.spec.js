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

function createWrapper(store) {
  return shallowMount(Login, {
    localVue,
    store,
    mocks: {
      $route: { query: {} },
      $router: { push: jest.fn() }
    }
  })
}

describe('Login.vue', () => {
  let store

  beforeEach(() => {
    store = createStore()
    global.fetch = jest.fn()
    global.alert = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('renders username and password inputs', () => {
    const wrapper = createWrapper(store)
    const inputs = wrapper.findAll('input')
    const types = inputs.wrappers.map(w => w.attributes('type'))
    expect(types).toContain('text')
    expect(types).toContain('password')
  })

  test('calls /Auth/Login on form submit', async () => {
    global.fetch.mockResolvedValue({
      status: 200,
      json: async () => ({ username: 'testuser' })
    })
    const wrapper = createWrapper(store)
    await wrapper.setData({ username: 'testuser', password: 'secret' })
    await wrapper.find('input[type="button"]').trigger('click')
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/Auth/Login',
      expect.objectContaining({ method: 'POST' })
    )
  })

  test('on 200 response, commits to Vuex store', async () => {
    global.fetch.mockResolvedValue({
      status: 200,
      json: async () => ({ username: 'testuser' })
    })
    const commitSpy = jest.spyOn(store, 'commit')
    const wrapper = createWrapper(store)
    await wrapper.setData({ username: 'testuser', password: 'secret' })
    await wrapper.find('input[type="button"]').trigger('click')
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(commitSpy).toHaveBeenCalledWith('set_vuex_globalUser', 'testuser')
    expect(commitSpy).toHaveBeenCalledWith('set_vuex_isAuthenticated', true)
  })

  test('on 401 response, shows an error message', async () => {
    global.fetch.mockResolvedValue({
      status: 401,
      json: async () => ({ message: 'Invalid credentials' })
    })
    const wrapper = createWrapper(store)
    await wrapper.setData({ username: 'baduser', password: 'badpass' })
    await wrapper.find('input[type="button"]').trigger('click')
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(wrapper.vm.login_status_code).toBe(401)
    expect(wrapper.find('.error-message').exists()).toBe(true)
  })

  test('on 401 response, calls alert with the error message', async () => {
    global.fetch.mockResolvedValue({
      status: 401,
      json: async () => ({ message: 'Invalid credentials' })
    })
    const wrapper = createWrapper(store)
    await wrapper.setData({ username: 'baduser', password: 'badpass' })
    await wrapper.find('input[type="button"]').trigger('click')
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('Invalid credentials'))
  })

  test('on 200 response, redirects to /my-wish-list', async () => {
    global.fetch.mockResolvedValue({
      status: 200,
      json: async () => ({ username: 'testuser' })
    })
    const wrapper = createWrapper(store)
    await wrapper.setData({ username: 'testuser', password: 'secret' })
    await wrapper.find('input[type="button"]').trigger('click')
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(wrapper.vm.$router.push).toHaveBeenCalledWith('/my-wish-list')
  })

  test('on unexpected status code, does not commit to store or redirect', async () => {
    global.fetch.mockResolvedValue({
      status: 500,
      json: async () => ({ message: 'Server error' })
    })
    const commitSpy = jest.spyOn(store, 'commit')
    const wrapper = createWrapper(store)
    await wrapper.setData({ username: 'testuser', password: 'secret' })
    await wrapper.find('input[type="button"]').trigger('click')
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(commitSpy).not.toHaveBeenCalled()
    expect(wrapper.vm.$router.push).not.toHaveBeenCalled()
  })

  test('when fetch throws a network error, calls alert with support message', async () => {
    global.fetch.mockRejectedValue(new Error('Network failure'))
    const wrapper = createWrapper(store)
    await wrapper.setData({ username: 'testuser', password: 'secret' })
    await wrapper.find('input[type="button"]').trigger('click')
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('technical issues'))
  })

  test('mounted with ?logout=true resets form fields and Vuex store', async () => {
    const loggedInStore = createStore({
      state: { vuex_globalUser: 'testuser', vuex_isAuthenticated: true }
    })
    const commitSpy = jest.spyOn(loggedInStore, 'commit')
    shallowMount(Login, {
      localVue,
      store: loggedInStore,
      mocks: {
        $route: { query: { logout: 'true' } },
        $router: { push: jest.fn() }
      }
    })
    await localVue.nextTick()
    expect(commitSpy).toHaveBeenCalledWith('set_vuex_globalUser', '')
    expect(commitSpy).toHaveBeenCalledWith('set_vuex_isAuthenticated', false)
  })

  test('logout() resets username, password and login_status_code', async () => {
    const wrapper = createWrapper(store)
    await wrapper.setData({ username: 'testuser', password: 'secret', login_status_code: 200 })
    wrapper.vm.logout()
    expect(wrapper.vm.username).toBe('')
    expect(wrapper.vm.password).toBe('')
    expect(wrapper.vm.login_status_code).toBe(418)
  })
})
