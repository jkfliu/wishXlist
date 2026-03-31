import { shallowMount } from '@vue/test-utils'
import Groups from '@/components/Content/Groups.vue'
import { localVue, createStore } from './helpers'

const sampleGroups = [
  { _id: 'g1', name: 'Public',     inviteCode: 'PUBLIC',   members: ['me@example.com'] },
  { _id: 'g2', name: 'My Friends', inviteCode: 'A1B2C3D4', members: ['me@example.com'] },
]

function createWrapper(store = createStore('me@example.com')) {
  return shallowMount(Groups, { localVue, store })
}

beforeEach(() => {
  jest.spyOn(window, 'alert').mockImplementation(() => {})
  jest.spyOn(window, 'confirm').mockImplementation(() => true)
})

afterEach(() => {
  jest.restoreAllMocks()
})


describe('Groups.vue — rendering', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => sampleGroups,
    })
  })

  test('renders create-group form', async () => {
    const wrapper = createWrapper()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.group-create').exists()).toBe(true)
  })

  test('renders join-group form', async () => {
    const wrapper = createWrapper()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.group-join').exists()).toBe(true)
  })

  test('renders group list section', async () => {
    const wrapper = createWrapper()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.group-list').exists()).toBe(true)
  })

  test('renders one row per group', async () => {
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
    expect(wrapper.findAll('tbody tr').length).toBe(sampleGroups.length)
  })

  test('Public group does not render a Show code button', async () => {
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
    const rows = wrapper.findAll('tbody tr')
    const publicRow = rows.at(0) // first is Public
    expect(publicRow.find('.show-code-btn').exists()).toBe(false)
  })

  test('non-public group renders a Show code button', async () => {
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
    const rows = wrapper.findAll('tbody tr')
    const friendsRow = rows.at(1) // second is My Friends
    expect(friendsRow.find('.show-code-btn').exists()).toBe(true)
  })
})


describe('Groups.vue — fetchGroups()', () => {
  test('calls GET /Groups with credentials on mount', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] })
    createWrapper()
    await new Promise(r => setTimeout(r, 0))
    expect(global.fetch).toHaveBeenCalledWith(
      '/Groups',
      expect.objectContaining({ credentials: 'include' })
    )
  })

  test('populates groups from response', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => sampleGroups })
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
    expect(wrapper.vm.groups.length).toBe(2)
  })

  test('handles non-ok response without crash (groups stays empty)', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 })
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
    expect(wrapper.vm.groups).toEqual([])
  })

  test('handles network error without crash', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network failure'))
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
    expect(wrapper.vm.groups).toEqual([])
  })
})


describe('Groups.vue — createGroup()', () => {
  test('does nothing if newGroupName is empty', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] })
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
    global.fetch.mockClear()
    wrapper.vm.newGroupName = ''
    await wrapper.vm.createGroup()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  test('POSTs to /Groups/Create with name and credentials', async () => {
    const newGroup = { _id: 'g3', name: 'Family', inviteCode: 'ABCD1234', members: ['me@example.com'] }
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] })           // fetchGroups
      .mockResolvedValueOnce({ ok: true, json: async () => newGroup })      // createGroup
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
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

  test('pushes returned group into groups list', async () => {
    const newGroup = { _id: 'g3', name: 'Family', inviteCode: 'ABCD1234', members: ['me@example.com'] }
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => newGroup })
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
    wrapper.vm.newGroupName = 'Family'
    await wrapper.vm.createGroup()
    expect(wrapper.vm.groups.some(g => g._id === 'g3')).toBe(true)
  })

  test('clears newGroupName after success', async () => {
    const newGroup = { _id: 'g3', name: 'Family', inviteCode: 'ABCD1234', members: ['me@example.com'] }
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => newGroup })
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
    wrapper.vm.newGroupName = 'Family'
    await wrapper.vm.createGroup()
    expect(wrapper.vm.newGroupName).toBe('')
  })
})


describe('Groups.vue — joinGroup()', () => {
  test('does nothing if joinCode is empty', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] })
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
    global.fetch.mockClear()
    wrapper.vm.joinCode = ''
    await wrapper.vm.joinGroup()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  test('POSTs to /Groups/Join with inviteCode and credentials', async () => {
    const joined = { _id: 'g4', name: 'Work', inviteCode: 'WORK1234', members: ['me@example.com'] }
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => joined })
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
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

  test('pushes returned group into groups list', async () => {
    const joined = { _id: 'g4', name: 'Work', inviteCode: 'WORK1234', members: ['me@example.com'] }
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => joined })
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
    wrapper.vm.joinCode = 'WORK1234'
    await wrapper.vm.joinGroup()
    expect(wrapper.vm.groups.some(g => g._id === 'g4')).toBe(true)
  })

  test('clears joinCode after success', async () => {
    const joined = { _id: 'g4', name: 'Work', inviteCode: 'WORK1234', members: ['me@example.com'] }
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => joined })
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
    wrapper.vm.joinCode = 'WORK1234'
    await wrapper.vm.joinGroup()
    expect(wrapper.vm.joinCode).toBe('')
  })
})


describe('Groups.vue — leaveGroup()', () => {
  test('does nothing if confirm() returns false', async () => {
    window.confirm.mockReturnValue(false)
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => sampleGroups })
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
    global.fetch.mockClear()
    await wrapper.vm.leaveGroup('g2')
    expect(global.fetch).not.toHaveBeenCalled()
  })

  test('POSTs to /Groups/Leave with groupId and credentials', async () => {
    const remaining = { _id: 'g2', name: 'My Friends', inviteCode: 'A1B2C3D4', members: [] }
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => sampleGroups })
      .mockResolvedValueOnce({ ok: true, json: async () => remaining })
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
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

  test('removes group from groups list after success', async () => {
    const remaining = { _id: 'g2', name: 'My Friends', inviteCode: 'A1B2C3D4', members: [] }
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => sampleGroups })
      .mockResolvedValueOnce({ ok: true, json: async () => remaining })
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.leaveGroup('g2')
    expect(wrapper.vm.groups.some(g => g._id === 'g2')).toBe(false)
  })
})


describe('Groups.vue — toggleCode()', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => sampleGroups })
  })

  test('sets showingCodeFor to the group _id on first call', async () => {
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
    wrapper.vm.toggleCode('g2')
    expect(wrapper.vm.showingCodeFor).toBe('g2')
  })

  test('sets showingCodeFor back to null on second call (same group)', async () => {
    const wrapper = createWrapper()
    await new Promise(r => setTimeout(r, 0))
    wrapper.vm.toggleCode('g2')
    wrapper.vm.toggleCode('g2')
    expect(wrapper.vm.showingCodeFor).toBeNull()
  })
})
