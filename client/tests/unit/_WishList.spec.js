import { shallowMount } from '@vue/test-utils'
import WishList from '@/components/Wish/_WishList.vue'
import { localVue, createStore } from './helpers'

const sampleWishItems = [
  {
    _id: '1',
    user_name: 'testuser',
    item_name: 'Item One',
    model: 'Model A',
    price: '10.00',
    store: 'Store A',
    gifter_user_name: '',
    gifted_date: null
  },
  {
    _id: '2',
    user_name: 'testuser',
    item_name: 'Item Two',
    model: 'Model B',
    price: '20.00',
    store: 'Store B',
    gifter_user_name: 'friend1',
    gifted_date: new Date().toUTCString()
  }
]

function createWrapper(store, displayMode = 'self', items = sampleWishItems) {
  return shallowMount(WishList, {
    localVue,
    store,
    propsData: {
      wish_list_array: items,
      display_mode: displayMode
    }
  })
}

describe('_WishList.vue', () => {
  let store

  beforeEach(() => {
    store = createStore('testuser')
  })

  test('renders correct number of rows', () => {
    const wrapper = createWrapper(store)
    const rows = wrapper.findAll('tbody tr')
    expect(rows.length).toBe(sampleWishItems.length)
  })

  test("in 'self' mode, ungifted items show Edit and Delete buttons", () => {
    const wrapper = createWrapper(store, 'self')
    const rows = wrapper.findAll('tbody tr')
    // First row is ungifted - should have Edit (.far.fa-edit) and Delete (.far.fa-trash-alt) icons
    const firstRow = rows.at(0)
    expect(firstRow.find('.far.fa-edit').exists()).toBe(true)
    expect(firstRow.find('.far.fa-trash-alt').exists()).toBe(true)
  })

  test("in 'group' mode, ungifted items show Gift button, no Edit/Delete", () => {
    const wrapper = createWrapper(store, 'group')
    const rows = wrapper.findAll('tbody tr')
    // First row is ungifted
    const firstRow = rows.at(0)
    expect(firstRow.find('.fa.fa-gift').exists()).toBe(true)
    expect(firstRow.find('.far.fa-edit').exists()).toBe(false)
    expect(firstRow.find('.far.fa-trash-alt').exists()).toBe(false)
  })

  test("gifted items don't show Gift button in group mode", () => {
    const wrapper = createWrapper(store, 'group')
    const rows = wrapper.findAll('tbody tr')
    const secondRow = rows.at(1)
    expect(secondRow.find('.fa.fa-gift').exists()).toBe(false)
  })

  test('renders empty message when wish_list_array is empty', () => {
    const wrapper = createWrapper(store, 'self', [])
    expect(wrapper.find('.empty-table').exists()).toBe(true)
    expect(wrapper.find('table').exists()).toBe(false)
  })

  test("in 'self' mode, gifted items show only Delete button (no Edit)", () => {
    const wrapper = createWrapper(store, 'self')
    const rows = wrapper.findAll('tbody tr')
    const secondRow = rows.at(1) // gifted item
    expect(secondRow.find('.far.fa-trash-alt').exists()).toBe(true)
    expect(secondRow.find('.far.fa-edit').exists()).toBe(false)
  })

  test('clicking Delete emits delete:wish_item with the item _id', async () => {
    const wrapper = createWrapper(store, 'self')
    const rows = wrapper.findAll('tbody tr')
    await rows.at(0).find('.far.fa-trash-alt').trigger('click')
    expect(wrapper.emitted('delete:wish_item')).toBeTruthy()
    expect(wrapper.emitted('delete:wish_item')[0]).toEqual(['1'])
  })

  test('editMode() enters editing state for the clicked item', async () => {
    const wrapper = createWrapper(store, 'self')
    const rows = wrapper.findAll('tbody tr')
    await rows.at(0).find('.far.fa-edit').trigger('click')
    expect(wrapper.vm.editing).toBe('1')
  })

  test('entering edit mode renders input fields instead of text', async () => {
    const wrapper = createWrapper(store, 'self')
    const rows = wrapper.findAll('tbody tr')
    await rows.at(0).find('.far.fa-edit').trigger('click')
    await wrapper.vm.$nextTick()
    const firstRow = wrapper.findAll('tbody tr').at(0)
    expect(firstRow.findAll('input[type="text"]').length).toBeGreaterThan(0)
  })

  test('cancelEdit() restores original item values and exits editing mode', async () => {
    const wrapper = createWrapper(store, 'self')
    const rows = wrapper.findAll('tbody tr')
    await rows.at(0).find('.far.fa-edit').trigger('click')
    await wrapper.vm.$nextTick()

    // Mutate item name in edit mode
    wrapper.vm.wish_list_array[0].item_name = 'Changed Name'
    const editingRow = wrapper.findAll('tbody tr').at(0)
    await editingRow.find('.fas.fa-undo').trigger('click')

    expect(wrapper.vm.editing).toBeNull()
    expect(wrapper.vm.wish_list_array[0].item_name).toBe('Item One')
  })

  test('saving an edit emits edit:wish_item and exits editing mode', async () => {
    const wrapper = createWrapper(store, 'self')
    const rows = wrapper.findAll('tbody tr')
    await rows.at(0).find('.far.fa-edit').trigger('click')
    await wrapper.vm.$nextTick()

    const editingRow = wrapper.findAll('tbody tr').at(0)
    await editingRow.find('.far.fa-save').trigger('click')

    expect(wrapper.emitted('edit:wish_item')).toBeTruthy()
    expect(wrapper.vm.editing).toBeNull()
  })

  test('saving with empty item_name does not emit edit:wish_item', async () => {
    const wrapper = createWrapper(store, 'self')
    const firstRow = wrapper.findAll('tbody tr').at(0)
    await firstRow.find('.far.fa-edit').trigger('click')
    await wrapper.vm.$nextTick()

    wrapper.vm.wish_list_array[0].item_name = ''
    await firstRow.find('.far.fa-save').trigger('click')

    expect(wrapper.emitted('edit:wish_item')).toBeFalsy()
  })

  test('giftWishItem() sets gifter, gifted_date and emits gift:wish_item', async () => {
    const wrapper = createWrapper(store, 'group')
    const rows = wrapper.findAll('tbody tr')
    await rows.at(0).find('.fa.fa-gift').trigger('click')

    expect(wrapper.vm.wish_list_array[0].gifter_user_name).toBe('testuser')
    expect(wrapper.vm.wish_list_array[0].gifted_date).toBeTruthy()
    expect(wrapper.emitted('gift:wish_item')).toBeTruthy()
  })

  test('toDate() returns empty string for null/falsy input', () => {
    const wrapper = createWrapper(store)
    expect(wrapper.vm.toDate(null)).toBe('')
    expect(wrapper.vm.toDate(undefined)).toBe('')
    expect(wrapper.vm.toDate('')).toBe('')
  })

  test('toDate() returns formatted date string for a valid date', () => {
    const wrapper = createWrapper(store)
    const result = wrapper.vm.toDate('2024-12-25T00:00:00.000Z')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})
