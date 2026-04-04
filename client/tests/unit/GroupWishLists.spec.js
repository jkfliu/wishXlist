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
    .mockResolvedValueOnce({ ok: true, json: async () => groups })        // mounted - /Groups (parallel)
    .mockResolvedValueOnce({ ok: true, json: async () => items })         // mounted - /WishList (parallel)
    .mockResolvedValueOnce({ ok: true, json: async () => ({ members }) }) // mounted - /Groups/Members
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

  test('shows group label (not dropdown) when user belongs to exactly one group', async () => {
    global.fetch = makeFetch([sampleGroups[0]], sampleGroups[0].members, sampleWishItems)
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
    expect(wrapper.find('.group-label').exists()).toBe(true)
    expect(wrapper.find('.group-label strong').text()).toBe('Public')
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

  test('fetches /Groups and /WishList in parallel, then /Groups/Members on mount', async () => {
    global.fetch = makeFetch(sampleGroups, sampleGroups[0].members, sampleWishItems)
    createWrapper()
    await new Promise(r => setTimeout(r, 0))
    expect(global.fetch).toHaveBeenCalledTimes(3)
    const urls = global.fetch.mock.calls.map(c => c[0])
    expect(urls[0]).toContain('/Groups')
    expect(urls[1]).toContain('/WishList')
    expect(urls[2]).toContain('/Groups/Members')
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
      .mockResolvedValueOnce({ ok: true, json: async () => [sampleGroups[0]] }) // /Groups
      .mockResolvedValueOnce({ ok: true, json: async () => sampleWishItems })   // /WishList
      .mockResolvedValueOnce({ ok: false, status: 500 })                         // /Groups/Members
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
    expect(wrapper.vm.wish_list_array).toEqual([])
  })

  test('handles /WishList non-ok response gracefully', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [sampleGroups[0]] }) // /Groups
      .mockResolvedValueOnce({ ok: false, status: 500 })                         // /WishList
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
    expect(wrapper.vm.wish_list_array).toEqual([])
  })
})


describe('GroupWishLists.vue — visibleToGroups filtering', () => {
  const itemVisibleToAll    = { _id: 'w1', user_name: 'alice@example.com', item_name: 'Visible to all',    visibleToGroups: [] }
  const itemVisibleToG1     = { _id: 'w2', user_name: 'alice@example.com', item_name: 'Visible to g1',     visibleToGroups: ['g1'] }
  const itemVisibleToG2     = { _id: 'w3', user_name: 'alice@example.com', item_name: 'Visible to g2',     visibleToGroups: ['g2'] }
  const itemNoField         = { _id: 'w4', user_name: 'alice@example.com', item_name: 'No field (legacy)'  }

  test('shows items with visibleToGroups: [] in the selected group', async () => {
    global.fetch = makeFetch([sampleGroups[0]], ['alice@example.com'], [itemVisibleToAll])
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
    expect(wrapper.vm.wish_list_array.some(i => i._id === 'w1')).toBe(true)
  })

  test('shows items whose visibleToGroups includes the selected group', async () => {
    global.fetch = makeFetch([sampleGroups[0]], ['alice@example.com'], [itemVisibleToG1])
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
    expect(wrapper.vm.wish_list_array.some(i => i._id === 'w2')).toBe(true)
  })

  test('hides items whose visibleToGroups does not include the selected group', async () => {
    global.fetch = makeFetch([sampleGroups[0]], ['alice@example.com'], [itemVisibleToG2])
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
    expect(wrapper.vm.wish_list_array.some(i => i._id === 'w3')).toBe(false)
  })

  test('shows legacy items with no visibleToGroups field', async () => {
    global.fetch = makeFetch([sampleGroups[0]], ['alice@example.com'], [itemNoField])
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
    expect(wrapper.vm.wish_list_array.some(i => i._id === 'w4')).toBe(true)
  })
})


describe('GroupWishLists.vue — fetchGroups() error paths', () => {
  test('handles non-ok response without crash', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: false, status: 500 })
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
    expect(wrapper.vm.groups).toEqual([])
  })

  test('handles network error without crash', async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network failure'))
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
    expect(wrapper.vm.groups).toEqual([])
  })

  test('does not set selectedGroupId when no groups returned', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => [] })
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
    expect(wrapper.vm.selectedGroupId).toBeNull()
  })
})


describe('GroupWishLists.vue — loadWishListForGroup() via group change', () => {
  test('reloads wish list when group selection changes', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => sampleGroups })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ members: ['alice@example.com'] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => sampleWishItems })
      // second loadWishListForGroup call after group change
      .mockResolvedValueOnce({ ok: true, json: async () => ({ members: ['bob@example.com'] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => sampleWishItems })

    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))

    wrapper.vm.selectedGroupId = 'g2'
    await wrapper.vm.loadWishListForGroup()

    expect(wrapper.vm.wish_list_array.some(i => i.user_name === 'bob@example.com')).toBe(true)
    expect(wrapper.vm.wish_list_array.some(i => i.user_name === 'alice@example.com')).toBe(false)
  })

  test('does nothing if selectedGroupId is null', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => [] })
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
    global.fetch.mockClear()
    wrapper.vm.selectedGroupId = null
    await wrapper.vm.loadWishListForGroup()
    expect(global.fetch).not.toHaveBeenCalled()
  })
})


describe('GroupWishLists.vue — giftWishItem()', () => {
  test('POSTs to /WishList/Update and updates local array', async () => {
    // _WishList.vue sets gifter_user_name before emitting, so the item arrives pre-mutated
    const gifted = { ...sampleWishItems[0], gifter_user_name: 'me@example.com' }
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [sampleGroups[0]] })         // /Groups
      .mockResolvedValueOnce({ ok: true, json: async () => [sampleWishItems[0]] })      // /WishList
      .mockResolvedValueOnce({ ok: true, json: async () => ({ members: ['alice@example.com'] }) }) // /Groups/Members
      .mockResolvedValueOnce({ ok: true, json: async () => gifted })                    // /WishList/Update

    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))

    await wrapper.vm.giftWishItem(gifted)

    expect(global.fetch).toHaveBeenCalledWith(
      '/WishList/Update',
      expect.objectContaining({ method: 'POST' })
    )
    expect(wrapper.vm.wish_list_array[0].gifter_user_name).toBe('me@example.com')
  })

  test('does nothing if confirm returns false', async () => {
    window.confirm.mockReturnValue(false)
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [sampleGroups[0]] })
      .mockResolvedValueOnce({ ok: true, json: async () => [sampleWishItems[0]] })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ members: ['alice@example.com'] }) })

    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
    global.fetch.mockClear()

    await wrapper.vm.giftWishItem({ ...sampleWishItems[0] })
    expect(global.fetch).not.toHaveBeenCalled()
  })

  test('handles non-ok response without crash', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [sampleGroups[0]] })
      .mockResolvedValueOnce({ ok: true, json: async () => [sampleWishItems[0]] })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ members: ['alice@example.com'] }) })
      .mockResolvedValueOnce({ ok: false, status: 500 })

    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))

    await expect(wrapper.vm.giftWishItem({ ...sampleWishItems[0] })).resolves.not.toThrow()
  })
})
