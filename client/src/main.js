import Vue     from 'vue'
import App     from '@/App.vue'

import store   from '@/vuex_store.js'
import router  from '@/router.js'

// Are we in Prod?
Vue.config.productionTip = false

// Global variables... or use Vuex store instead!
//Vue.prototype.globalUser      = ''
//Vue.prototype.isAuthenticated = false

new Vue({
  router,
  store,
  render: h => h(App),
}).$mount('#app')