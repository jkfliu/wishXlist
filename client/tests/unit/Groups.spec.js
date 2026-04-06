import { shallowMount } from '@vue/test-utils'
import Groups from '@/components/Content/Groups.vue'
import { localVue, createStore } from './helpers'

const sampleGroups = [
  { _id: 'g1', name: 'Public',     inviteCode: 'PUBLIC',   members: ['me@example.com'] },
  { _id: 'g2', name: 'My Friends', inviteCode: 'A1B2C3D4', members: ['me@example.com'] },
]

function createWrapper(groups = sampleGroups, query = {}) {
  const store = createStore('me@example.com', true, true, groups)
  return shallowMount(Groups, {
    localVue,
    store,
    mocks: { $route: { query } },
  })
}

beforeEach(() => {
  jest.spyOn(window, 'alert').mockImplementation(() => {})
  jest.spyOn(window, 'confirm').mockImplementation(() => true)
})

afterEach(() => {
  jest.restoreAllMocks()
})


describe('Groups.vue — rendering', () => {
  test('renders create-group form', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.group-create').exists()).toBe(true)
  })

  test('renders join-group form', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.group-join').exists()).toBe(true)
  })

  test('renders group list section', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.group-list').exists()).toBe(true)
  })

  test('renders one row per group', () => {
    const wrapper = createWrapper()
    expect(wrapper.findAll('tbody tr').length).toBe(sampleGroups.length)
  })

  test('Public group does not render a Show code button', () => {
    const wrapper = createWrapper()
    const rows = wrapper.findAll('tbody tr')
    const publicRow = rows.at(0)
    expect(publicRow.find('.show-code-btn').exists()).toBe(false)
  })

  test('non-public group renders an invite code input', () => {
    const wrapper = createWrapper()
    const rows = wrapper.findAll('tbody tr')
    const friendsRow = rows.at(1)
    expect(friendsRow.find('.invite-code-input').exists()).toBe(true)
  })

  test('shows spinner when groups is empty and user is authenticated', () => {
    const wrapper = createWrapper([])
    expect(wrapper.find('.fa-spinner').exists()).toBe(true)
  })

  test('does not show spinner when groups are loaded', () => {
    const wrapper = createWrapper(sampleGroups)
    expect(wrapper.find('.fa-spinner').exists()).toBe(false)
  })
})


describe('Groups.vue — groups from Vuex store', () => {
  test('reads groups from Vuex store (no /Groups fetch on mount)', async () => {
    global.fetch = jest.fn()
    createWrapper()
    await new Promise(r => setTimeout(r, 0))
    const groupsFetch = global.fetch.mock.calls.find(c => c[0] === '/Groups')
    expect(groupsFetch).toBeUndefined()
  })

  test('groups computed reflects store state', () => {
    const wrapper = createWrapper(sampleGroups)
    expect(wrapper.vm.groups).toEqual(sampleGroups)
  })
})


describe('Groups.vue — createGroup()', () => {
  test('does nothing if newGroupName is empty', async () => {
    global.fetch = jest.fn()
    const wrapper = createWrapper()
    wrapper.vm.newGroupName = ''
    await wrapper.vm.createGroup()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  test('POSTs to /Groups/Create with name and credentials', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => ({}) })
    const wrapper = createWrapper()
    wrapper.vm.newGroupName = 'Family'
    await wrapper.vm.createGroup()
    expect(global.fetch).toHaveBeenCalledWith(
      '/Groups/Create',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ name: 'Family' }),
      })
    )
  })

  test('dispatches fetchGroups after success', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => ({}) })
    const store = createStore('me@example.com', true, true, sampleGroups)
    const dispatchSpy = jest.spyOn(store, 'dispatch')
    shallowMount(Groups, { localVue, store, mocks: { $route: { query: {} } } })
    const wrapper = shallowMount(Groups, { localVue, store, mocks: { $route: { query: {} } } })
    wrapper.vm.newGroupName = 'Family'
    await wrapper.vm.createGroup()
    expect(dispatchSpy).toHaveBeenCalledWith('fetchGroups')
  })

  test('clears newGroupName after success', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => ({}) })
    const wrapper = createWrapper()
    wrapper.vm.newGroupName = 'Family'
    await wrapper.vm.createGroup()
    expect(wrapper.vm.newGroupName).toBe('')
  })
})


describe('Groups.vue — joinGroup()', () => {
  test('does nothing if joinCode is empty', async () => {
    global.fetch = jest.fn()
    const wrapper = createWrapper()
    wrapper.vm.joinCode = ''
    await wrapper.vm.joinGroup()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  test('POSTs to /Groups/Join with inviteCode and credentials', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => ({}) })
    const wrapper = createWrapper()
    wrapper.vm.joinCode = 'WORK1234'
    await wrapper.vm.joinGroup()
    expect(global.fetch).toHaveBeenCalledWith(
      '/Groups/Join',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ inviteCode: 'WORK1234' }),
      })
    )
  })

  test('dispatches fetchGroups after success', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => ({}) })
    const store = createStore('me@example.com', true, true, sampleGroups)
    const dispatchSpy = jest.spyOn(store, 'dispatch')
    const wrapper = shallowMount(Groups, { localVue, store, mocks: { $route: { query: {} } } })
    wrapper.vm.joinCode = 'WORK1234'
    await wrapper.vm.joinGroup()
    expect(dispatchSpy).toHaveBeenCalledWith('fetchGroups')
  })

  test('clears joinCode after success', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => ({}) })
    const wrapper = createWrapper()
    wrapper.vm.joinCode = 'WORK1234'
    await wrapper.vm.joinGroup()
    expect(wrapper.vm.joinCode).toBe('')
  })

  test('Join button click sends joinCode string, not an event object', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => ({}) })
    const wrapper = createWrapper()
    wrapper.vm.joinCode = 'WORK1234'
    await wrapper.find('.group-join button').trigger('click')
    await wrapper.vm.$nextTick()
    const body = JSON.parse(global.fetch.mock.calls[0][1].body)
    expect(typeof body.inviteCode).toBe('string')
    expect(body.inviteCode).toBe('WORK1234')
  })

  test('joinGroup with explicit code (e.g. PUBLIC) does not clear joinCode input', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => ({}) })
    const wrapper = createWrapper()
    wrapper.vm.joinCode = 'something'
    await wrapper.vm.joinGroup('PUBLIC')
    expect(wrapper.vm.joinCode).toBe('something')
  })
})


describe('Groups.vue — leaveGroup()', () => {
  test('does nothing if confirm() returns false', async () => {
    window.confirm.mockReturnValue(false)
    global.fetch = jest.fn()
    const wrapper = createWrapper()
    await wrapper.vm.leaveGroup('g2')
    expect(global.fetch).not.toHaveBeenCalled()
  })

  test('POSTs to /Groups/Leave with groupId and credentials', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => ({}) })
    const wrapper = createWrapper()
    await wrapper.vm.leaveGroup('g2')
    expect(global.fetch).toHaveBeenCalledWith(
      '/Groups/Leave',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ groupId: 'g2' }),
      })
    )
  })

  test('dispatches fetchGroups after success', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => ({}) })
    const store = createStore('me@example.com', true, true, sampleGroups)
    const dispatchSpy = jest.spyOn(store, 'dispatch')
    const wrapper = shallowMount(Groups, { localVue, store, mocks: { $route: { query: {} } } })
    await wrapper.vm.leaveGroup('g2')
    expect(dispatchSpy).toHaveBeenCalledWith('fetchGroups')
  })
})


describe('Groups.vue — copyUrl()', () => {
  beforeEach(() => {
    Object.assign(navigator, { clipboard: { writeText: jest.fn() } })
  })

  test('writes invite URL to clipboard', async () => {
    const wrapper = createWrapper()
    wrapper.vm.copyUrl('A1B2C3D4')
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('/groups?join=A1B2C3D4')
    )
  })
})
