import { createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'

export const localVue = createLocalVue()
localVue.use(Vuex)

export function createStore(username = 'testuser') {
  return new Vuex.Store({
    state: {
      vuex_globalUser: username,
      vuex_isAuthenticated: true
    },
    mutations: {
      set_vuex_globalUser(state, user) { state.vuex_globalUser = user },
      set_vuex_isAuthenticated(state, bool) { state.vuex_isAuthenticated = bool }
    }
  })
}
