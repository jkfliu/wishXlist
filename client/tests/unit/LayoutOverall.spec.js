import { shallowMount } from '@vue/test-utils'
import LayoutOverall from '@/components/Layout/LayoutOverall.vue'
import { localVue, createStore } from './helpers'

function createWrapper(store) {
  return shallowMount(LayoutOverall, { localVue, store })
}

describe('LayoutOverall.vue — nav toggle', () => {
  test('renders nav slot when navVisible is true', () => {
    const store = createStore('testuser', true, true)
    const wrapper = createWrapper(store)
    expect(wrapper.find('nav').exists()).toBe(true)
  })

  test('hides nav when navVisible is false', () => {
    const store = createStore('testuser', true, false)
    const wrapper = createWrapper(store)
    expect(wrapper.find('nav').exists()).toBe(false)
  })

  test('nav visibility reacts when store state changes', async () => {
    const store = createStore('testuser', true, true)
    const wrapper = createWrapper(store)
    expect(wrapper.find('nav').exists()).toBe(true)
    store.commit('toggle_nav_visible')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('nav').exists()).toBe(false)
  })

  test('renders backdrop when navVisible is true', () => {
    const store = createStore('testuser', true, true)
    const wrapper = createWrapper(store)
    expect(wrapper.find('.nav-backdrop').exists()).toBe(true)
  })

  test('does not render backdrop when navVisible is false', () => {
    const store = createStore('testuser', true, false)
    const wrapper = createWrapper(store)
    expect(wrapper.find('.nav-backdrop').exists()).toBe(false)
  })

  test('clicking backdrop commits toggle_nav_visible', async () => {
    const store = createStore('testuser', true, true)
    const wrapper = createWrapper(store)
    await wrapper.find('.nav-backdrop').trigger('click')
    expect(store.state.navVisible).toBe(false)
  })
})
