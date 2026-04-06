import 'es6-promise'    // Needed for using Vuex and IE
import Vue  from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const store = new Vuex.Store({
  state: {
    vuex_globalUser:      localStorage.getItem('vuex_globalUser')      || '',
    vuex_displayName:     localStorage.getItem('vuex_displayName')     || '',
    vuex_isAuthenticated: localStorage.getItem('vuex_isAuthenticated') === 'true',
    navVisible:           localStorage.getItem('navVisible') !== 'false',
  },

  mutations: {
    set_vuex_globalUser(state, user) {
      state.vuex_globalUser = user
      localStorage.setItem('vuex_globalUser', user)
    },
    set_vuex_displayName(state, name) {
      state.vuex_displayName = name
      localStorage.setItem('vuex_displayName', name)
    },
    set_vuex_isAuthenticated(state, bool) {
      state.vuex_isAuthenticated = bool
      localStorage.setItem('vuex_isAuthenticated', String(bool))
    },
    toggle_nav_visible(state) {
      state.navVisible = !state.navVisible
      localStorage.setItem('navVisible', String(state.navVisible))
    },
    set_nav_visible(state, bool) {
      state.navVisible = bool
    },
  },

  actions: {
    async fetchCurrentUser({ commit }) {
      try {
        const res = await fetch('/Auth/Me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          commit('set_vuex_globalUser', data.username);
          commit('set_vuex_displayName', data.displayName || '');
          commit('set_vuex_isAuthenticated', true);
        } else {
          commit('set_vuex_globalUser', '');
          commit('set_vuex_isAuthenticated', false);
        }
      } catch {
        commit('set_vuex_globalUser', '');
        commit('set_vuex_isAuthenticated', false);
      }
    }
  }
})

export default store
