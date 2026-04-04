import { shallowMount } from '@vue/test-utils'
import MyWishList from '@/components/Wish/MyWishList.vue'
import { localVue, createStore } from './helpers'

const sampleGroups = [
  { _id: 'g1', name: 'Public',     inviteCode: 'PUBLIC' },
  { _id: 'g2', name: 'My Friends', inviteCode: 'A1B2C3D4' },
]

function createWrapper(store = createStore('me@example.com')) {
  return shallowMount(MyWishList, { localVue, store })
}

beforeEach(() => {
  jest.spyOn(window, 'alert').mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
})


describe('MyWishList.vue — fetchGroups()', () => {
  test('fetches groups on mount and stores them', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] })            // getWishList
      .mockResolvedValueOnce({ ok: true, json: async () => sampleGroups })  // fetchGroups
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
    expect(wrapper.vm.groups).toEqual(sampleGroups)
  })

  test('calls GET /Groups with credentials', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
    createWrapper()
    await new Promise(r => setTimeout(r, 0))
    const groupCall = global.fetch.mock.calls.find(c => c[0] === '/Groups')
    expect(groupCall).toBeDefined()
    expect(groupCall[1]).toEqual(expect.objectContaining({ credentials: 'include' }))
  })

  test('groups defaults to empty array when fetch fails', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: false, status: 500 })
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
    expect(wrapper.vm.groups).toEqual([])
  })
})


describe('MyWishList.vue — groups prop passed to children', () => {
  test('passes groups to wish-item-form', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => sampleGroups })
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
    expect(wrapper.vm.groups).toEqual(sampleGroups)
    // Verify the template binds :groups to both children
    expect(wrapper.html()).toContain('groups=')
  })

  test('passes groups to both wish-item-form and wish-list-table via template', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => sampleGroups })
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
    // shallowMount renders stub attributes — verify :groups binding appears twice (form + table)
    const matches = wrapper.html().match(/groups=/g)
    expect(matches).toHaveLength(2)
  })
})
