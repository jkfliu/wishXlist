import { shallowMount } from '@vue/test-utils'
import GroupWishLists from '@/components/Wish/GroupWishLists.vue'
import { localVue, createStore } from './helpers'

const sampleGroups = [
  { _id: 'g1', name: 'Public',     inviteCode: 'PUBLIC'   },
  { _id: 'g2', name: 'My Friends', inviteCode: 'A1B2C3D4' },
]

const sampleItems = [
  { _id: 'w1', user_name: 'alice@example.com', item_name: 'Alice Item', visibleToGroups: [] },
  { _id: 'w2', user_name: 'bob@example.com',   item_name: 'Bob Item',   visibleToGroups: [] },
]

function createWrapper(groups = sampleGroups) {
  const store = createStore('me@example.com', true, true, groups)
  return shallowMount(GroupWishLists, { localVue, store })
}

beforeEach(() => {
  jest.spyOn(window, 'alert').mockImplementation(() => {})
  jest.spyOn(window, 'confirm').mockImplementation(() => true)
})

afterEach(() => {
  jest.restoreAllMocks()
})


describe('GroupWishLists.vue — rendering', () => {
  test('shows dropdown when user belongs to more than one group', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => sampleItems })
    const wrapper = createWrapper(sampleGroups)
    await new Promise(r => setTimeout(r, 0))
    expect(wrapper.find('select').exists()).toBe(true)
  })

  test('does not show dropdown when user belongs to exactly one group', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => sampleItems })
    const wrapper = createWrapper([sampleGroups[0]])
    await new Promise(r => setTimeout(r, 0))
    expect(wrapper.find('select').exists()).toBe(false)
  })

  test('shows group label (not dropdown) when user belongs to exactly one group', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => sampleItems })
    const wrapper = createWrapper([sampleGroups[0]])
    await new Promise(r => setTimeout(r, 0))
    expect(wrapper.find('.group-label').exists()).toBe(true)
    expect(wrapper.find('.group-label strong').text()).toBe('Public')
  })

  test('wish_list_array is empty when server returns empty array', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => [] })
    const wrapper = createWrapper([sampleGroups[0]])
    await new Promise(r => setTimeout(r, 0))
    expect(wrapper.vm.wish_list_array).toEqual([])
  })
})


describe('GroupWishLists.vue — mounted() / data loading', () => {
  test('reads groups from Vuex store (no /Groups fetch)', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => sampleItems })
    createWrapper(sampleGroups)
    await new Promise(r => setTimeout(r, 0))
    const groupsFetch = global.fetch.mock.calls.find(c => c[0] === '/Groups')
    expect(groupsFetch).toBeUndefined()
  })

  test('sets selectedGroupId to first group _id after mount', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => sampleItems })
    const wrapper = createWrapper(sampleGroups)
    await new Promise(r => setTimeout(r, 0))
    expect(wrapper.vm.selectedGroupId).toBe('g1')
  })

  test('fetches /WishList?groupId= on mount (1 call total)', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => sampleItems })
    createWrapper(sampleGroups)
    await new Promise(r => setTimeout(r, 0))
    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(global.fetch.mock.calls[0][0]).toContain('/WishList?groupId=g1')
  })

  test('populates wish_list_array with server response', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => sampleItems })
    const wrapper = createWrapper(sampleGroups)
    await new Promise(r => setTimeout(r, 0))
    expect(wrapper.vm.wish_list_array).toHaveLength(2)
  })

  test('does not fetch wish list when user belongs to no groups', async () => {
    global.fetch = jest.fn()
    const wrapper = createWrapper([])
    await new Promise(r => setTimeout(r, 0))
    expect(global.fetch).not.toHaveBeenCalled()
    expect(wrapper.vm.selectedGroupId).toBeNull()
  })
})


describe('GroupWishLists.vue — loadWishListForGroup() error paths', () => {
  test('handles /WishList non-ok response gracefully', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: false, status: 500 })
    const wrapper = createWrapper([sampleGroups[0]])
    await new Promise(r => setTimeout(r, 0))
    expect(wrapper.vm.wish_list_array).toEqual([])
  })

  test('does nothing if selectedGroupId is null', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => sampleItems })
    const wrapper = createWrapper(sampleGroups)
    await new Promise(r => setTimeout(r, 0))
    global.fetch.mockClear()
    wrapper.vm.selectedGroupId = null
    await wrapper.vm.loadWishListForGroup()
    expect(global.fetch).not.toHaveBeenCalled()
  })
})


describe('GroupWishLists.vue — loadWishListForGroup() via group change', () => {
  test('fetches /WishList?groupId=g2 when group selection changes to g2', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => sampleItems })        // initial /WishList?groupId=g1
      .mockResolvedValueOnce({ ok: true, json: async () => [sampleItems[1]] })   // /WishList?groupId=g2

    const wrapper = createWrapper(sampleGroups)
    await new Promise(r => setTimeout(r, 0))

    wrapper.vm.selectedGroupId = 'g2'
    await wrapper.vm.loadWishListForGroup()

    const lastCall = global.fetch.mock.calls[global.fetch.mock.calls.length - 1]
    expect(lastCall[0]).toContain('/WishList?groupId=g2')
    expect(wrapper.vm.wish_list_array).toHaveLength(1)
  })
})


describe('GroupWishLists.vue — Vuex group wish list cache', () => {
  const GROUP_WISH_LIST_TTL_MS = 2 * 60 * 1000

  test('stores fetched items in groupWishListCache on mount', async () => {
    const store = createStore('me@example.com', true, true, sampleGroups)
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => sampleItems })
    shallowMount(GroupWishLists, { localVue, store })
    await new Promise(r => setTimeout(r, 0))
    expect(store.state.groupWishListCache['g1'].items).toHaveLength(2)
  })

  test('uses cached items when cache is fresh (no fetch)', async () => {
    const store = createStore('me@example.com', true, true, sampleGroups)
    store.commit('set_group_wish_list_cache', { groupId: 'g1', items: sampleItems })
    global.fetch = jest.fn()
    const wrapper = shallowMount(GroupWishLists, { localVue, store })
    await new Promise(r => setTimeout(r, 0))
    expect(global.fetch).not.toHaveBeenCalled()
    expect(wrapper.vm.wish_list_array).toHaveLength(2)
  })

  test('re-fetches when cache is stale (older than 2 minutes)', async () => {
    const store = createStore('me@example.com', true, true, sampleGroups)
    store.commit('set_group_wish_list_cache', { groupId: 'g1', items: sampleItems })
    // manually backdate the fetchedAt timestamp
    store.state.groupWishListCache['g1'].fetchedAt = Date.now() - GROUP_WISH_LIST_TTL_MS - 1
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => sampleItems })
    shallowMount(GroupWishLists, { localVue, store })
    await new Promise(r => setTimeout(r, 0))
    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(global.fetch.mock.calls[0][0]).toContain('/WishList?groupId=g1')
  })

  test('updates cache after giftWishItem', async () => {
    const store = createStore('me@example.com', true, true, [sampleGroups[0]])
    store.commit('set_group_wish_list_cache', { groupId: 'g1', items: [sampleItems[0]] })
    const gifted = { ...sampleItems[0], gifter_user_name: 'me@example.com' }
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => gifted })
    const wrapper = shallowMount(GroupWishLists, { localVue, store })
    await new Promise(r => setTimeout(r, 0))

    await wrapper.vm.giftWishItem(gifted)
    expect(store.state.groupWishListCache['g1'].items[0].gifter_user_name).toBe('me@example.com')
  })

  test('re-fetches for new groupId when switching groups (no cache for that group)', async () => {
    const store = createStore('me@example.com', true, true, sampleGroups)
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => sampleItems })       // initial g1
      .mockResolvedValueOnce({ ok: true, json: async () => [sampleItems[1]] })  // g2 (no cache)
    const wrapper = shallowMount(GroupWishLists, { localVue, store })
    await new Promise(r => setTimeout(r, 0))

    global.fetch.mockClear()
    wrapper.vm.selectedGroupId = 'g2'
    await wrapper.vm.loadWishListForGroup()
    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(global.fetch.mock.calls[0][0]).toContain('/WishList?groupId=g2')
  })
})


describe('GroupWishLists.vue — giftWishItem()', () => {
  test('PUTs to /WishList/:id and updates local array', async () => {
    const gifted = { ...sampleItems[0], gifter_user_name: 'me@example.com' }
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [sampleItems[0]] })  // /WishList?groupId=
      .mockResolvedValueOnce({ ok: true, json: async () => gifted })             // PUT /WishList/:id

    const wrapper = createWrapper([sampleGroups[0]])
    await new Promise(r => setTimeout(r, 0))

    await wrapper.vm.giftWishItem(gifted)

    expect(global.fetch).toHaveBeenCalledWith(
      `/WishList/${sampleItems[0]._id}`,
      expect.objectContaining({ method: 'PUT' })
    )
    expect(wrapper.vm.wish_list_array[0].gifter_user_name).toBe('me@example.com')
  })

  test('does nothing if confirm returns false', async () => {
    window.confirm.mockReturnValue(false)
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => [sampleItems[0]] })

    const wrapper = createWrapper([sampleGroups[0]])
    await new Promise(r => setTimeout(r, 0))
    global.fetch.mockClear()

    await wrapper.vm.giftWishItem({ ...sampleItems[0] })
    expect(global.fetch).not.toHaveBeenCalled()
  })

  test('handles non-ok response without crash', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [sampleItems[0]] })
      .mockResolvedValueOnce({ ok: false, status: 500 })

    const wrapper = createWrapper([sampleGroups[0]])
    await new Promise(r => setTimeout(r, 0))

    await expect(wrapper.vm.giftWishItem({ ...sampleItems[0] })).resolves.not.toThrow()
  })
})
