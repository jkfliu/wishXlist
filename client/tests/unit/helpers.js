import { createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'

export const localVue = createLocalVue()
localVue.use(Vuex)

export function createStore(username = 'testuser', isAuthenticated = true, navVisible = true) {
  return new Vuex.Store({
    state: {
      vuex_globalUser:      username,
      vuex_displayName:     '',
      vuex_isAuthenticated: isAuthenticated,
      navVisible:           navVisible,
    },
    mutations: {
      set_vuex_globalUser(state, user) { state.vuex_globalUser = user },
      set_vuex_displayName(state, name) { state.vuex_displayName = name },
      set_vuex_isAuthenticated(state, bool) { state.vuex_isAuthenticated = bool },
      toggle_nav_visible(state) { state.navVisible = !state.navVisible },
    },
    actions: {
      fetchCurrentUser: jest.fn(),
    }
  })
}
