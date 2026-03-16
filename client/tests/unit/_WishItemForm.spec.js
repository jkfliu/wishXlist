import { shallowMount } from '@vue/test-utils'
import WishItemForm from '@/components/Wish/_WishItemForm.vue'
import { localVue, createStore } from './helpers'

function createWrapper(store) {
  return shallowMount(WishItemForm, {
    localVue,
    store
  })
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
