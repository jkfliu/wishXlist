import { shallowMount } from '@vue/test-utils'
import WishList from '@/components/Wish/_WishList.vue'
import { localVue, createStore } from './helpers'

const sampleWishItems = [
  {
    _id: '1',
    user_name: 'testuser',
    item_name: 'Banana',
    model: 'Model B',
    price: '20.00',
    store: 'Store B',
    item_create_date: '2024-01-02T00:00:00.000Z',
    gifter_user_name: '',
    gifted_date: null
  },
  {
    _id: '2',
    user_name: 'testuser',
    item_name: 'Apple',
    model: 'Model A',
    price: '10.00',
    store: 'Store A',
    item_create_date: '2024-01-01T00:00:00.000Z',
    gifter_user_name: 'friend1',
    gifted_date: '2024-06-01T00:00:00.000Z'
  }
]

function createWrapper(store, displayMode = 'self', items = sampleWishItems) {
  return shallowMount(WishList, {
    localVue,
    store,
    propsData: {
      wish_list_array: items.map(item => ({ ...item })),
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
    expect(wrapper.vm.wish_list_array[0].item_name).toBe('Banana')
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


describe('_WishList.vue — sorting', () => {
  let store

  beforeEach(() => {
    store = createStore('testuser')
  })

  test('sortedList defaults to original order (no sort applied)', () => {
    const wrapper = createWrapper(store)
    expect(wrapper.vm.sortedList[0]._id).toBe('1')
    expect(wrapper.vm.sortedList[1]._id).toBe('2')
  })

  test('clicking item_name header sorts ascending (A→Z)', async () => {
    const wrapper = createWrapper(store)
    await wrapper.find('th[data-sort="item_name"]').trigger('click')
    expect(wrapper.vm.sortedList[0].item_name).toBe('Apple')
    expect(wrapper.vm.sortedList[1].item_name).toBe('Banana')
  })

  test('clicking item_name header twice sorts descending (Z→A)', async () => {
    const wrapper = createWrapper(store)
    await wrapper.find('th[data-sort="item_name"]').trigger('click')
    await wrapper.find('th[data-sort="item_name"]').trigger('click')
    expect(wrapper.vm.sortedList[0].item_name).toBe('Banana')
    expect(wrapper.vm.sortedList[1].item_name).toBe('Apple')
  })

  test('clicking price header sorts numerically ascending', async () => {
    const wrapper = createWrapper(store)
    await wrapper.find('th[data-sort="price"]').trigger('click')
    expect(wrapper.vm.sortedList[0].price).toBe('10.00')
    expect(wrapper.vm.sortedList[1].price).toBe('20.00')
  })

  test('clicking a different header resets to ascending', async () => {
    const wrapper = createWrapper(store)
    await wrapper.find('th[data-sort="item_name"]').trigger('click')
    await wrapper.find('th[data-sort="item_name"]').trigger('click') // now descending
    await wrapper.find('th[data-sort="price"]').trigger('click')     // new column → ascending
    expect(wrapper.vm.sortAsc).toBe(true)
    expect(wrapper.vm.sortKey).toBe('price')
  })

  test('unsorted columns show ↕ indicator', () => {
    const wrapper = createWrapper(store)
    expect(wrapper.find('th[data-sort="item_name"]').text()).toContain('↕')
  })

  test('active sort column shows ▲ indicator', async () => {
    const wrapper = createWrapper(store)
    await wrapper.find('th[data-sort="item_name"]').trigger('click')
    expect(wrapper.find('th[data-sort="item_name"]').text()).toContain('▲')
  })

  test('descending sort shows ▼ indicator', async () => {
    const wrapper = createWrapper(store)
    await wrapper.find('th[data-sort="item_name"]').trigger('click')
    await wrapper.find('th[data-sort="item_name"]').trigger('click')
    expect(wrapper.find('th[data-sort="item_name"]').text()).toContain('▼')
  })

  test('sorting by gifted_date sorts chronologically', async () => {
    const wrapper = createWrapper(store)
    await wrapper.find('th[data-sort="gifted_date"]').trigger('click')
    // null gifted_date sorts last
    expect(wrapper.vm.sortedList[0].gifted_date).toBeTruthy()
    expect(wrapper.vm.sortedList[1].gifted_date).toBeFalsy()
  })
})
