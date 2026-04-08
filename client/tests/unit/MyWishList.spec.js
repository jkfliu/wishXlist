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
  jest.spyOn(window, 'confirm').mockImplementation(() => true)
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


describe('MyWishList.vue — Vuex wish list cache', () => {
  const items = [{ _id: 'w1', user_name: 'me@example.com', item_name: 'Thing' }]

  test('stores fetched items in wishListCache on mount', async () => {
    const store = createStore('me@example.com', true, true, sampleGroups)
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => items })
    shallowMount(MyWishList, { localVue, store })
    await new Promise(r => setTimeout(r, 0))
    expect(store.state.wishListCache['me@example.com']).toHaveLength(1)
  })

  test('uses cached items on mount when cache is populated (no fetch)', async () => {
    const store = createStore('me@example.com', true, true, sampleGroups)
    store.commit('set_wish_list_cache', { username: 'me@example.com', items })
    global.fetch = jest.fn()
    const wrapper = shallowMount(MyWishList, { localVue, store })
    await new Promise(r => setTimeout(r, 0))
    expect(global.fetch).not.toHaveBeenCalled()
    expect(wrapper.vm.wish_list_array).toHaveLength(1)
  })

  test('updates cache after addWishItem', async () => {
    const store = createStore('me@example.com', true, true, sampleGroups)
    store.commit('set_wish_list_cache', { username: 'me@example.com', items })
    const newItem = { _id: 'w2', user_name: 'me@example.com', item_name: 'New Thing' }
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => newItem })
    const wrapper = shallowMount(MyWishList, { localVue, store })
    await new Promise(r => setTimeout(r, 0))

    await wrapper.vm.addWishItem({ item_name: 'New Thing' })
    expect(store.state.wishListCache['me@example.com']).toHaveLength(2)
  })

  test('updates cache after editWishItem', async () => {
    const store = createStore('me@example.com', true, true, sampleGroups)
    store.commit('set_wish_list_cache', { username: 'me@example.com', items })
    const updated = { ...items[0], item_name: 'Updated Thing' }
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => updated })
    const wrapper = shallowMount(MyWishList, { localVue, store })
    await new Promise(r => setTimeout(r, 0))

    await wrapper.vm.editWishItem(updated)
    expect(store.state.wishListCache['me@example.com'][0].item_name).toBe('Updated Thing')
  })

  test('updates cache after deleteWishItem', async () => {
    const store = createStore('me@example.com', true, true, sampleGroups)
    store.commit('set_wish_list_cache', { username: 'me@example.com', items })
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })  // delete
    const wrapper = shallowMount(MyWishList, { localVue, store })
    await new Promise(r => setTimeout(r, 0))

    await wrapper.vm.deleteWishItem('w1')
    expect(store.state.wishListCache['me@example.com']).toHaveLength(0)
  })
})
