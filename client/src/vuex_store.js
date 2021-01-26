import 'es6-promise'    // Needed for using Vuex and IE
import Vue  from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

// Initialise
const store = new Vuex.Store({
  state: {
    vuex_globalUser: '',
    vuex_isAuthenticated: false
  },

  mutations: {
    set_vuex_globalUser(state, user) {
      console.log('vuex_store.js:: set_vuex_globalUser to ' + user)
      state.vuex_globalUser = user
    },
    set_vuex_isAuthenticated(state, bool) {
      console.log('vuex_store.js:: set_vuex_is_Authenticated to ' + bool)
      state.vuex_isAuthenticated = bool
    }
  }

})

export default store