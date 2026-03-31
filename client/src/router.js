import Vue            from 'vue'
import Router         from 'vue-router'

import WishxlistHome  from '@/components/Content/WishxlistHome.vue'
import AboutWishxlist from '@/components/Content/AboutWishxlist.vue'
import ShareTheMeal   from '@/components/Content/ShareTheMeal.vue'

import MyWishList     from '@/components/Wish/MyWishList.vue'
import GroupWishLists from '@/components/Wish/GroupWishLists.vue'
import Groups         from '@/components/Content/Groups.vue'

import Login          from '@/components/Login.vue'
import Profile        from '@/components/Profile.vue'

import store          from '@/vuex_store.js'

// Define routes
Vue.use(Router)

const router = new Router({
  mode:            'history',
  linkActiveClass: 'active',

  routes: [
    // Path - navigation path
    // Name - unique name to identify the route
    // Component - a reference to the imported component
    // meta
    {path: '/',                 name: 'home',             component: WishxlistHome,  meta: {allowAnonymous: true} },
    {path: '/about',            name: 'about',            component: AboutWishxlist, meta: {allowAnonymous: true} },
    {path: '/login',            name: 'login',            component: Login,          meta: {allowAnonymous: true} },
    {path: '/feelin-lucky',     name: 'share-the-meal',   component: ShareTheMeal,   meta: {allowAnonymous: true} },
    {path: '/profile',          name: 'profile',          component: Profile,        },
    {path: '/groups',           name: 'groups',           component: Groups,         },
    {path: '/my-wish-list',     name: 'my-wish-list',     component: MyWishList,     },
    {path: '/group-wish-lists', name: 'group-wish-lists', component: GroupWishLists, }
  ]
})

router.beforeEach((to, from, next) => {

  /*
  console.log('router.js: beforeEach: to, from paths:         ' + 'to:' + to.path + ' from:' + from.path)
  console.log('router.js: beforeEach: to.meta.allowAnonymous: ' + to.meta.allowAnonymous)
  console.log('router.js: beforeEach: vuex_isAuthenticated:   ' + store.state.vuex_isAuthenticated)
  console.log("router.js: vuex: vuex_globalUser " + store.state.vuex_globalUser + ', vuex_isAuthenticated ' + store.state.vuex_isAuthenticated)
  */

  if (!to.meta.allowAnonymous && !store.state.vuex_isAuthenticated) {
    next({
      path:   '/login',
      query: { redirect: to.fullPath }
    })
  } else {
    next()
  }
  
})

export default router