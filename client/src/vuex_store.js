import 'es6-promise'    // Needed for using Vuex and IE
import Vue  from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

// Collapse nav at the start of every session; persist within the session as user toggles
if (sessionStorage.getItem('navVisible') === null) {
  sessionStorage.setItem('navVisible', 'false')
}

const store = new Vuex.Store({
  state: {
    vuex_globalUser:      localStorage.getItem('vuex_globalUser')      || '',
    vuex_displayName:     localStorage.getItem('vuex_displayName')     || '',
    vuex_isAuthenticated: localStorage.getItem('vuex_isAuthenticated') === 'true',
    vuex_isAdmin:         localStorage.getItem('vuex_isAdmin') === 'true',
    navVisible:           sessionStorage.getItem('navVisible') !== 'false',
    groups:               [],
    groupsLoaded:         false,
    groupsError:          false,
    sessionValidatedAt:   0,
    wishListCache:        {},   // { [username]: items[] }
    groupWishListCache:   {},   // { [groupId]:  { items: [], fetchedAt: timestamp } }
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
    set_vuex_isAdmin(state, bool) {
      state.vuex_isAdmin = bool
      localStorage.setItem('vuex_isAdmin', String(bool))
    },
    toggle_nav_visible(state) {
      state.navVisible = !state.navVisible
      sessionStorage.setItem('navVisible', String(state.navVisible))
    },
    set_nav_visible(state, bool) {
      state.navVisible = bool
    },
    set_groups(state, groups) {
      state.groups = groups
    },
    set_groups_loaded(state, loaded) {
      state.groupsLoaded = loaded
    },
    set_groups_error(state, error) {
      state.groupsError = error
    },
    set_session_validated_at(state, ts) {
      state.sessionValidatedAt = ts
    },
    set_wish_list_cache(state, { username, items }) {
      state.wishListCache = { ...state.wishListCache, [username]: items }
    },
    set_group_wish_list_cache(state, { groupId, items }) {
      state.groupWishListCache = {
        ...state.groupWishListCache,
        [groupId]: { items, fetchedAt: Date.now() },
      }
    },
  },

  actions: {
    async fetchCurrentUser({ commit, dispatch }) {
      try {
        const res = await fetch('/Auth/Me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          commit('set_vuex_globalUser', data.username);
          commit('set_vuex_displayName', data.displayName || '');
          commit('set_vuex_isAuthenticated', true);
          commit('set_vuex_isAdmin', !!data.isAdmin);
          commit('set_session_validated_at', Date.now());
          await dispatch('fetchGroups');
        } else {
          commit('set_vuex_globalUser', '');
          commit('set_vuex_isAuthenticated', false);
          commit('set_vuex_isAdmin', false);
          commit('set_groups', []);
        }
      } catch {
        commit('set_vuex_globalUser', '');
        commit('set_vuex_isAuthenticated', false);
        commit('set_vuex_isAdmin', false);
        commit('set_groups', []);
      }
    },

    logout({ commit }) {
      commit('set_vuex_globalUser', '');
      commit('set_vuex_displayName', '');
      commit('set_vuex_isAuthenticated', false);
      commit('set_vuex_isAdmin', false);
      commit('set_groups', []);
    },

    async fetchGroups({ commit }) {
      try {
        const res = await fetch('/Groups', { credentials: 'include' });
        if (res.ok) {
          commit('set_groups', await res.json());
          commit('set_groups_error', false);
        } else {
          commit('set_groups_error', true);
        }
      } catch (err) {
        console.error('fetchGroups:', err);
        commit('set_groups_error', true);
      } finally {
        commit('set_groups_loaded', true);
      }
    },
  }
})

export default store
