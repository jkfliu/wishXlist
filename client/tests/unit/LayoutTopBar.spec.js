import { shallowMount } from '@vue/test-utils'
import LayoutTopBar from '@/components/Layout/LayoutTopBar.vue'
import { localVue, createStore } from './helpers'

function createWrapper(store) {
  return shallowMount(LayoutTopBar, {
    localVue,
    store,
    mocks: {
      $route:  { query: {} },
      $router: { push: jest.fn() },
    }
  })
}

describe('LayoutTopBar.vue — hamburger toggle', () => {
  test('renders a nav toggle button', () => {
    const store = createStore()
    const wrapper = createWrapper(store)
    expect(wrapper.find('.nav-toggle-btn').exists()).toBe(true)
  })

  test('clicking the toggle button commits toggle_nav_visible', async () => {
    const store = createStore()
    const commitSpy = jest.spyOn(store, 'commit')
    const wrapper = createWrapper(store)
    await wrapper.find('.nav-toggle-btn').trigger('click')
    expect(commitSpy).toHaveBeenCalledWith('toggle_nav_visible')
  })
})
