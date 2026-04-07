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

describe('LayoutTopBar.vue — logo', () => {
  test('renders the app logo link', () => {
    const store = createStore()
    const wrapper = createWrapper(store)
    expect(wrapper.find('img').exists()).toBe(true)
  })
})
