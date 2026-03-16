import { shallowMount } from '@vue/test-utils'
import Profile from '@/components/Profile.vue'
import { localVue, createStore } from './helpers'

function createWrapper(store) {
  return shallowMount(Profile, {
    localVue,
    store
  })
}

describe('Profile.vue', () => {
  let store

  beforeEach(() => {
    store = createStore('testuser')
    global.fetch = jest.fn()
    global.alert = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('displays the username from the store', () => {
    const wrapper = createWrapper(store)
    expect(wrapper.text()).toContain('testuser')
  })

  test('when new_password1 !== new_password2, shows validation error without calling API', async () => {
    const wrapper = createWrapper(store)
    // Reveal the change password form
    await wrapper.setData({ flagChangePassword: true })
    await wrapper.setData({
      old_password: 'oldpass',
      new_password1: 'newpass1',
      new_password2: 'newpass2_different'
    })
    await wrapper.find('input[value="Change Password"]').trigger('click')
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(global.fetch).not.toHaveBeenCalled()
    expect(wrapper.vm.error_msg).not.toBe('')
    expect(wrapper.find('.error-message').exists()).toBe(true)
  })

  test('when passwords match, calls /Auth/Change_Password', async () => {
    global.fetch.mockResolvedValue({
      status: 200,
      json: async () => ({ success: true, message: 'Password updated' })
    })
    const wrapper = createWrapper(store)
    await wrapper.setData({ flagChangePassword: true })
    await wrapper.setData({
      old_password: 'oldpass',
      new_password1: 'newpass',
      new_password2: 'newpass'
    })
    await wrapper.find('input[value="Change Password"]').trigger('click')
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/Auth/Change_Password',
      expect.objectContaining({ method: 'POST' })
    )
  })

  test('when change_password returns success=false, sets error_msg', async () => {
    global.fetch.mockResolvedValue({
      status: 200,
      json: async () => ({ success: false, message: 'Incorrect old password' })
    })
    const wrapper = createWrapper(store)
    await wrapper.setData({ flagChangePassword: true })
    await wrapper.setData({ old_password: 'wrong', new_password1: 'newpass', new_password2: 'newpass' })
    await wrapper.find('input[value="Change Password"]').trigger('click')
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(wrapper.vm.error_msg).toBe('Incorrect old password')
    expect(wrapper.find('.error-message').exists()).toBe(true)
  })

  test('cancel_change_password() hides form and resets all fields', async () => {
    const wrapper = createWrapper(store)
    await wrapper.setData({
      flagChangePassword: true,
      old_password: 'oldpass',
      new_password1: 'newpass',
      new_password2: 'newpass',
      error_msg: 'Some error'
    })
    await wrapper.find('input[value="Cancel"]').trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.flagChangePassword).toBe(false)
    expect(wrapper.vm.old_password).toBe('')
    expect(wrapper.vm.new_password1).toBe('')
    expect(wrapper.vm.new_password2).toBe('')
    expect(wrapper.vm.error_msg).toBe('')
  })

  test('when fetch throws a network error, calls alert with support message', async () => {
    global.fetch.mockRejectedValue(new Error('Network failure'))
    const wrapper = createWrapper(store)
    await wrapper.setData({ flagChangePassword: true })
    await wrapper.setData({ old_password: 'oldpass', new_password1: 'newpass', new_password2: 'newpass' })
    await wrapper.find('input[value="Change Password"]').trigger('click')
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('technical issues'))
  })

  test('clicking Change Password button reveals the form', async () => {
    const wrapper = createWrapper(store)
    expect(wrapper.vm.flagChangePassword).toBe(false)
    await wrapper.find('input[value="Change Password"]').trigger('click')
    expect(wrapper.vm.flagChangePassword).toBe(true)
  })
})
