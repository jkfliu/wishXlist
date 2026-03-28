import { shallowMount } from '@vue/test-utils'
import Profile from '@/components/Profile.vue'
import { localVue, createStore } from './helpers'

function createWrapper(store) {
  return shallowMount(Profile, {
    localVue,
    store,
    mocks: {
      $router: { push: jest.fn() },
    }
  })
}

describe('Profile.vue', () => {
  let store

  beforeEach(() => {
    store = createStore('jkfliu@gmail.com')
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ username: 'jkfliu@gmail.com', displayName: 'Jason Liu' }),
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('displays the username from the Vuex store', () => {
    const wrapper = createWrapper(store)
    expect(wrapper.text()).toContain('jkfliu@gmail.com')
  })

  test('created() fetches /Auth/Me and sets displayName', async () => {
    const wrapper = createWrapper(store)
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(global.fetch).toHaveBeenCalledWith('/Auth/Me', { credentials: 'include' })
    expect(wrapper.vm.displayName).toBe('Jason Liu')
  })

  test('created() handles /Auth/Me non-ok response without crashing', async () => {
    global.fetch.mockResolvedValue({ ok: false })
    const wrapper = createWrapper(store)
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(wrapper.vm.displayName).toBe('')
  })

  test('created() handles /Auth/Me network failure without crashing', async () => {
    global.fetch.mockRejectedValue(new Error('Network failure'))
    const wrapper = createWrapper(store)
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(wrapper.vm.displayName).toBe('')
  })

  test('logout() POSTs to /Auth/Logout and redirects to /login?logout=true', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => ({}) })
    const wrapper = createWrapper(store)
    await wrapper.vm.logout()
    expect(global.fetch).toHaveBeenCalledWith('/Auth/Logout', { method: 'POST', credentials: 'include' })
    expect(wrapper.vm.$router.push).toHaveBeenCalledWith('/login?logout=true')
  })

  test('logout() redirects even if /Auth/Logout fetch fails', async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) }) // /Auth/Me in created()
      .mockRejectedValueOnce(new Error('Network failure'))           // /Auth/Logout
    const wrapper = createWrapper(store)
    await wrapper.vm.logout()
    expect(wrapper.vm.$router.push).toHaveBeenCalledWith('/login?logout=true')
  })
})
