import { shallowMount } from '@vue/test-utils'
import LayoutOverall from '@/components/Layout/LayoutOverall.vue'
import { localVue, createStore } from './helpers'

function createWrapper(store) {
  return shallowMount(LayoutOverall, { localVue, store })
}

describe('LayoutOverall.vue — nav toggle', () => {
  test('renders nav when navVisible is true', () => {
    const store = createStore('testuser', true, true)
    const wrapper = createWrapper(store)
    expect(wrapper.find('nav').exists()).toBe(true)
    expect(wrapper.find('nav').classes()).not.toContain('nav-collapsed')
  })

  test('nav has nav-collapsed class when navVisible is false', () => {
    const store = createStore('testuser', true, false)
    const wrapper = createWrapper(store)
    expect(wrapper.find('nav').exists()).toBe(true)
    expect(wrapper.find('nav').classes()).toContain('nav-collapsed')
  })

  test('nav-collapsed class reacts when store state changes', async () => {
    const store = createStore('testuser', true, true)
    const wrapper = createWrapper(store)
    expect(wrapper.find('nav').classes()).not.toContain('nav-collapsed')
    store.commit('toggle_nav_visible')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('nav').classes()).toContain('nav-collapsed')
  })
})
