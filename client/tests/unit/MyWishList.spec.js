import { shallowMount } from '@vue/test-utils'
import MyWishList from '@/components/Wish/MyWishList.vue'
import { localVue, createStore } from './helpers'

const sampleGroups = [
  { _id: 'g1', name: 'Public',     inviteCode: 'PUBLIC' },
  { _id: 'g2', name: 'My Friends', inviteCode: 'A1B2C3D4' },
]

function createWrapper(store = createStore('me@example.com', true, true, sampleGroups)) {
  return shallowMount(MyWishList, { localVue, store })
}

beforeEach(() => {
  jest.spyOn(window, 'alert').mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
})


describe('MyWishList.vue — groups from Vuex store', () => {
  test('reads groups from Vuex store (no /Groups fetch)', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => [] })
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
    expect(wrapper.vm.groups).toEqual(sampleGroups)
    const groupsFetch = global.fetch.mock.calls.find(c => c[0] === '/Groups')
    expect(groupsFetch).toBeUndefined()
  })

  test('passes groups to both wish-item-form and wish-list-table via template', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => [] })
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
    const matches = wrapper.html().match(/groups=/g)
    expect(matches).toHaveLength(2)
  })
})


describe('MyWishList.vue — getWishList()', () => {
  test('fetches wish list on mount', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => [] })
    createWrapper()
    await new Promise(r => setTimeout(r, 0))
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/WishList/'),
      expect.objectContaining({ credentials: 'include' })
    )
  })

  test('injects displayName from store into each item', async () => {
    const store = createStore('me@example.com', true, true, sampleGroups)
    store.commit('set_vuex_displayName', 'Me User')
    const items = [{ _id: 'w1', user_name: 'me@example.com', item_name: 'Thing' }]
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => items })
    const wrapper = shallowMount(MyWishList, { localVue, store })
    await new Promise(r => setTimeout(r, 0))
    expect(wrapper.vm.wish_list_array[0].displayName).toBe('Me User')
  })
})
