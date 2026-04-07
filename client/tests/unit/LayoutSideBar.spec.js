import { shallowMount } from '@vue/test-utils'
import LayoutSideBar from '@/components/Layout/LayoutSideBar.vue'
import { localVue, createStore } from './helpers'

function createWrapper(store) {
  return shallowMount(LayoutSideBar, { localVue, store })
}

describe('LayoutSideBar.vue — toggle button', () => {
  test('renders a toggle button', () => {
    const store = createStore()
    const wrapper = createWrapper(store)
    expect(wrapper.find('.toggle-btn').exists()).toBe(true)
  })

  test('clicking the toggle button commits toggle_nav_visible', async () => {
    const store = createStore()
    const commitSpy = jest.spyOn(store, 'commit')
    const wrapper = createWrapper(store)
    await wrapper.find('.toggle-btn').trigger('click')
    expect(commitSpy).toHaveBeenCalledWith('toggle_nav_visible')
  })
})
