import { shallowMount } from '@vue/test-utils'
import WishItemForm from '@/components/Wish/_WishItemForm.vue'
import { localVue, createStore } from './helpers'

function createWrapper(store) {
  return shallowMount(WishItemForm, {
    localVue,
    store
  })
}

const sampleGroups = [
  { _id: 'g1', name: 'Public' },
  { _id: 'g2', name: 'Friends' },
]

function createWrapperWithGroups(store, groups = []) {
  return shallowMount(WishItemForm, { localVue, store, propsData: { groups } })
}

describe('_WishItemForm.vue', () => {
  let store

  beforeEach(() => {
    store = createStore('testuser')
  })

  test('submit with empty item_name shows validation error', async () => {
    const wrapper = createWrapper(store)
    // item_name is empty by default
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.error).toBe(true)
    expect(wrapper.vm.submitting).toBe(true)
    expect(wrapper.find('.error-message').exists()).toBe(true)
  })

  test('submit with valid item_name emits add:wish_item with correct item object', async () => {
    const wrapper = createWrapper(store)
    await wrapper.setData({
      wish_item: {
        user_name: '',
        item_name: 'Test Item',
        model: 'Model X',
        price: '99.99',
        store: 'Amazon',
        item_create_date: ''
      }
    })
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('add:wish_item')).toBeTruthy()
    expect(wrapper.emitted('add:wish_item').length).toBe(1)
  })

  test('emitted item includes item_name, model, price, store fields', async () => {
    const wrapper = createWrapper(store)
    await wrapper.setData({
      wish_item: {
        user_name: '',
        item_name: 'Fancy Gadget',
        model: 'Model Z',
        price: '199.99',
        store: 'BestBuy',
        item_create_date: ''
      }
    })
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()
    const emitted = wrapper.emitted('add:wish_item')[0][0]
    expect(emitted.item_name).toBe('Fancy Gadget')
    expect(emitted.model).toBe('Model Z')
    expect(emitted.price).toBe('199.99')
    expect(emitted.store).toBe('BestBuy')
  })

  test('success message shows after valid submission', async () => {
    const wrapper = createWrapper(store)
    await wrapper.setData({
      wish_item: { user_name: '', item_name: 'Test Item', model: '', price: '', store: '', item_create_date: '' }
    })
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.success).toBe(true)
    expect(wrapper.find('.success-message').exists()).toBe(true)
  })

  test('clearStatus() via @keypress clears error and success flags', async () => {
    const wrapper = createWrapper(store)
    await wrapper.setData({ error: true, success: true })
    await wrapper.find('input[type="text"]').trigger('keypress')
    expect(wrapper.vm.error).toBe(false)
    expect(wrapper.vm.success).toBe(false)
  })

  test('clearStatus() method directly clears error and success flags', () => {
    const wrapper = createWrapper(store)
    wrapper.vm.error = true
    wrapper.vm.success = true
    wrapper.vm.clearStatus()
    expect(wrapper.vm.error).toBe(false)
    expect(wrapper.vm.success).toBe(false)
  })

  test('emitted item has user_name from Vuex store', async () => {
    const wrapper = createWrapper(store)
    await wrapper.setData({
      wish_item: { user_name: '', item_name: 'My Item', model: '', price: '', store: '', item_create_date: '' }
    })
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()
    const emitted = wrapper.emitted('add:wish_item')[0][0]
    expect(emitted.user_name).toBe('testuser')
  })
})


describe('_WishItemForm.vue — group visibility', () => {
  let store

  beforeEach(() => {
    store = createStore('testuser')
  })

  test('renders group checkboxes when groups prop provided', () => {
    const wrapper = createWrapperWithGroups(store, sampleGroups)
    expect(wrapper.find('.group-visibility').exists()).toBe(true)
    expect(wrapper.findAll('input[type="checkbox"]').length).toBe(2)
  })

  test('does not render group checkboxes when no groups', () => {
    const wrapper = createWrapperWithGroups(store, [])
    expect(wrapper.find('.group-visibility').exists()).toBe(false)
  })

  test('all groups are checked by default', () => {
    const wrapper = createWrapperWithGroups(store, sampleGroups)
    expect(wrapper.vm.selectedGroupIds).toEqual(['g1', 'g2'])
  })

  test('emits visibleToGroups as empty array when all groups selected (= visible to all)', async () => {
    const wrapper = createWrapperWithGroups(store, sampleGroups)
    await wrapper.setData({ wish_item: { item_name: 'Item', model: '', price: '', store: '', item_create_date: '' } })
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()
    const emitted = wrapper.emitted('add:wish_item')[0][0]
    expect(emitted.visibleToGroups).toEqual([])
  })

  test('emits specific group IDs when only some groups selected', async () => {
    const wrapper = createWrapperWithGroups(store, sampleGroups)
    wrapper.vm.selectedGroupIds = ['g1']
    await wrapper.setData({ wish_item: { item_name: 'Item', model: '', price: '', store: '', item_create_date: '' } })
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()
    const emitted = wrapper.emitted('add:wish_item')[0][0]
    expect(emitted.visibleToGroups).toEqual(['g1'])
  })

  test('last checked group checkbox is disabled (cannot uncheck)', () => {
    const wrapper = createWrapperWithGroups(store, sampleGroups)
    wrapper.vm.selectedGroupIds = ['g1']
    return wrapper.vm.$nextTick().then(() => {
      const checkboxes = wrapper.findAll('input[type="checkbox"]')
      const g1Box = checkboxes.wrappers.find(w => w.element.value === 'g1')
      expect(g1Box.element.disabled).toBe(true)
    })
  })

  test('resets selectedGroupIds to all after successful submit', async () => {
    const wrapper = createWrapperWithGroups(store, sampleGroups)
    wrapper.vm.selectedGroupIds = ['g1']
    await wrapper.setData({ wish_item: { item_name: 'Item', model: '', price: '', store: '', item_create_date: '' } })
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.selectedGroupIds).toEqual(['g1', 'g2'])
  })

  test('emits visibleToGroups as empty array when no groups prop (no groups joined)', async () => {
    const wrapper = createWrapper(store)
    await wrapper.setData({ wish_item: { item_name: 'Item', model: '', price: '', store: '', item_create_date: '' } })
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()
    const emitted = wrapper.emitted('add:wish_item')[0][0]
    expect(emitted.visibleToGroups).toEqual([])
  })

  test('blocks submit and shows error when groups exist but none selected', async () => {
    const wrapper = createWrapperWithGroups(store, sampleGroups)
    wrapper.vm.selectedGroupIds = []
    await wrapper.setData({ wish_item: { item_name: 'Item', model: '', price: '', store: '', item_create_date: '' } })
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('add:wish_item')).toBeFalsy()
    expect(wrapper.find('.error-message').exists()).toBe(true)
  })
})
