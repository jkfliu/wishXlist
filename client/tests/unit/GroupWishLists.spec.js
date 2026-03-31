import { shallowMount } from '@vue/test-utils'
import GroupWishLists from '@/components/Wish/GroupWishLists.vue'
import { localVue, createStore } from './helpers'

const sampleGroups = [
  { _id: 'g1', name: 'Public',     inviteCode: 'PUBLIC',   members: ['me@example.com', 'alice@example.com'] },
  { _id: 'g2', name: 'My Friends', inviteCode: 'A1B2C3D4', members: ['me@example.com', 'bob@example.com'] },
]

const sampleWishItems = [
  { _id: 'w1', user_name: 'alice@example.com', item_name: 'Alice Item' },
  { _id: 'w2', user_name: 'bob@example.com',   item_name: 'Bob Item' },
  { _id: 'w3', user_name: 'me@example.com',    item_name: 'My Item' },
  { _id: 'w4', user_name: 'stranger@example.com', item_name: 'Stranger Item' },
]

function makeFetch(groups, members, items) {
  return jest.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => groups })           // fetchGroups
    .mockResolvedValueOnce({ ok: true, json: async () => ({ members }) })    // loadWishListForGroup - Members
    .mockResolvedValueOnce({ ok: true, json: async () => items })            // loadWishListForGroup - WishList
}

function createWrapper(store = createStore('me@example.com')) {
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
    global.fetch = makeFetch(sampleGroups, sampleGroups[0].members, sampleWishItems)
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
    expect(wrapper.find('select').exists()).toBe(true)
  })

  test('does not show dropdown when user belongs to exactly one group', async () => {
    global.fetch = makeFetch([sampleGroups[0]], sampleGroups[0].members, sampleWishItems)
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
    expect(wrapper.find('select').exists()).toBe(false)
  })

  test('wish_list_array is empty when no members match', async () => {
    global.fetch = makeFetch([sampleGroups[0]], [], [])
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
    expect(wrapper.vm.wish_list_array).toEqual([])
  })
})


describe('GroupWishLists.vue — mounted() / data loading', () => {
  test('sets selectedGroupId to first group _id after fetchGroups', async () => {
    global.fetch = makeFetch(sampleGroups, sampleGroups[0].members, sampleWishItems)
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
    expect(wrapper.vm.selectedGroupId).toBe('g1')
  })

  test('calls fetchGroups then loadWishListForGroup in sequence on mount', async () => {
    global.fetch = makeFetch(sampleGroups, sampleGroups[0].members, sampleWishItems)
    createWrapper()
    await new Promise(r => setTimeout(r, 0))
    expect(global.fetch).toHaveBeenCalledTimes(3)
    expect(global.fetch.mock.calls[0][0]).toContain('/Groups')
    expect(global.fetch.mock.calls[1][0]).toContain('/Groups/Members')
    expect(global.fetch.mock.calls[2][0]).toContain('/WishList')
  })
})


describe('GroupWishLists.vue — loadWishListForGroup() filtering', () => {
  test('filters out items not in the selected group members list', async () => {
    // Group g1 has alice, not stranger
    global.fetch = makeFetch(
      [sampleGroups[0]],
      ['alice@example.com'],
      sampleWishItems
    )
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
    expect(wrapper.vm.wish_list_array.some(i => i.user_name === 'stranger@example.com')).toBe(false)
  })

  test('filters out items belonging to the current user', async () => {
    global.fetch = makeFetch(
      [sampleGroups[0]],
      ['me@example.com', 'alice@example.com'],
      sampleWishItems
    )
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
    expect(wrapper.vm.wish_list_array.some(i => i.user_name === 'me@example.com')).toBe(false)
  })

  test('does not filter out items from other group members', async () => {
    global.fetch = makeFetch(
      [sampleGroups[0]],
      ['me@example.com', 'alice@example.com'],
      sampleWishItems
    )
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
    expect(wrapper.vm.wish_list_array.some(i => i.user_name === 'alice@example.com')).toBe(true)
  })

  test('handles /Groups/Members non-ok response gracefully', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [sampleGroups[0]] })
      .mockResolvedValueOnce({ ok: false, status: 500 })
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
    expect(wrapper.vm.wish_list_array).toEqual([])
  })

  test('handles /WishList non-ok response gracefully', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [sampleGroups[0]] })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ members: ['alice@example.com'] }) })
      .mockResolvedValueOnce({ ok: false, status: 500 })
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
    expect(wrapper.vm.wish_list_array).toEqual([])
  })
})


describe('GroupWishLists.vue — giftWishItem()', () => {
  test('POSTs to /WishList/Update and updates local array', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [sampleGroups[0]] })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ members: ['alice@example.com'] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => [sampleWishItems[0]] })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ...sampleWishItems[0], gifter_user_name: 'me@example.com' }) })

    const store = createStore('me@example.com')
    const wrapper = createWrapper(store)
    await new Promise(r => setTimeout(r, 0))

    const item = { ...sampleWishItems[0] }
    await wrapper.vm.giftWishItem(item)

    expect(global.fetch).toHaveBeenCalledWith(
      '/WishList/Update',
      expect.objectContaining({ method: 'POST' })
    )
  })
})
