import { shallowMount } from '@vue/test-utils'
import GroupWishLists from '@/components/Wish/GroupWishLists.vue'
import { localVue, createStore } from './helpers'

const sampleGroups = [
  { _id: 'g1', name: 'Public',     inviteCode: 'PUBLIC'   },
  { _id: 'g2', name: 'My Friends', inviteCode: 'A1B2C3D4' },
]

// Server returns pre-filtered items — no own items, no restricted items
const sampleItems = [
  { _id: 'w1', user_name: 'alice@example.com', item_name: 'Alice Item', visibleToGroups: [] },
  { _id: 'w2', user_name: 'bob@example.com',   item_name: 'Bob Item',   visibleToGroups: [] },
]

function makeFetch(groups, items) {
  return jest.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => groups }) // mounted - /Groups
    .mockResolvedValueOnce({ ok: true, json: async () => items })  // loadWishListForGroup - /WishList?groupId=
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
    global.fetch = makeFetch(sampleGroups, sampleItems)
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
    expect(wrapper.find('select').exists()).toBe(true)
  })

  test('does not show dropdown when user belongs to exactly one group', async () => {
    global.fetch = makeFetch([sampleGroups[0]], sampleItems)
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
    expect(wrapper.find('select').exists()).toBe(false)
  })

  test('shows group label (not dropdown) when user belongs to exactly one group', async () => {
    global.fetch = makeFetch([sampleGroups[0]], sampleItems)
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
    expect(wrapper.find('.group-label').exists()).toBe(true)
    expect(wrapper.find('.group-label strong').text()).toBe('Public')
  })

  test('wish_list_array is empty when server returns empty array', async () => {
    global.fetch = makeFetch([sampleGroups[0]], [])
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
    expect(wrapper.vm.wish_list_array).toEqual([])
  })
})


describe('GroupWishLists.vue — mounted() / data loading', () => {
  test('sets selectedGroupId to first group _id after mount', async () => {
    global.fetch = makeFetch(sampleGroups, sampleItems)
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
    expect(wrapper.vm.selectedGroupId).toBe('g1')
  })

  test('fetches /Groups then /WishList?groupId= on mount (2 calls total)', async () => {
    global.fetch = makeFetch(sampleGroups, sampleItems)
    createWrapper()
    await new Promise(r => setTimeout(r, 0))
    expect(global.fetch).toHaveBeenCalledTimes(2)
    expect(global.fetch.mock.calls[0][0]).toContain('/Groups')
    expect(global.fetch.mock.calls[1][0]).toContain('/WishList?groupId=g1')
  })

  test('populates wish_list_array with server response', async () => {
    global.fetch = makeFetch(sampleGroups, sampleItems)
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
    expect(wrapper.vm.wish_list_array).toHaveLength(2)
  })
})


describe('GroupWishLists.vue — loadWishListForGroup() error paths', () => {
  test('handles /WishList non-ok response gracefully', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [sampleGroups[0]] })
      .mockResolvedValueOnce({ ok: false, status: 500 })
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
    expect(wrapper.vm.wish_list_array).toEqual([])
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
  test('fetches /WishList?groupId=g2 when group selection changes to g2', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => sampleGroups })  // /Groups
      .mockResolvedValueOnce({ ok: true, json: async () => sampleItems })   // initial /WishList?groupId=g1
      .mockResolvedValueOnce({ ok: true, json: async () => [sampleItems[1]] }) // /WishList?groupId=g2

    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))

    wrapper.vm.selectedGroupId = 'g2'
    await wrapper.vm.loadWishListForGroup()

    const lastCall = global.fetch.mock.calls[global.fetch.mock.calls.length - 1]
    expect(lastCall[0]).toContain('/WishList?groupId=g2')
    expect(wrapper.vm.wish_list_array).toHaveLength(1)
  })
})


describe('GroupWishLists.vue — giftWishItem()', () => {
  test('POSTs to /WishList/Update and updates local array', async () => {
    const gifted = { ...sampleItems[0], gifter_user_name: 'me@example.com' }
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [sampleGroups[0]] }) // /Groups
      .mockResolvedValueOnce({ ok: true, json: async () => [sampleItems[0]] }) // /WishList?groupId=
      .mockResolvedValueOnce({ ok: true, json: async () => gifted })            // /WishList/Update

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
    global.fetch = makeFetch([sampleGroups[0]], [sampleItems[0]])

    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
    global.fetch.mockClear()

    await wrapper.vm.giftWishItem({ ...sampleItems[0] })
    expect(global.fetch).not.toHaveBeenCalled()
  })

  test('handles non-ok response without crash', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [sampleGroups[0]] })
      .mockResolvedValueOnce({ ok: true, json: async () => [sampleItems[0]] })
      .mockResolvedValueOnce({ ok: false, status: 500 })

    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))

    await expect(wrapper.vm.giftWishItem({ ...sampleItems[0] })).resolves.not.toThrow()
  })
})
