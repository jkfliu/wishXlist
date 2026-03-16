import 'es6-promise'    // Needed for using Vuex and IE
import Vue  from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const store = new Vuex.Store({
  state: {
    vuex_globalUser:      localStorage.getItem('vuex_globalUser')      || '',
    vuex_isAuthenticated: localStorage.getItem('vuex_isAuthenticated') === 'true'
  },

  mutations: {
    set_vuex_globalUser(state, user) {
      state.vuex_globalUser = user
      localStorage.setItem('vuex_globalUser', user)
    },
    set_vuex_isAuthenticated(state, bool) {
      state.vuex_isAuthenticated = bool
      localStorage.setItem('vuex_isAuthenticated', String(bool))
    }
  }
})

export default store
