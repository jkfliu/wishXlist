import Vue            from 'vue'
import Router         from 'vue-router'

import WishxlistHome  from '@/components/Content/WishxlistHome.vue'
import AboutWishxlist from '@/components/Content/AboutWishxlist.vue'
import PrivacyPolicy  from '@/components/Content/PrivacyPolicy.vue'
import DataDeletion   from '@/components/Content/DataDeletion.vue'
import ShareTheMeal   from '@/components/Content/ShareTheMeal.vue'

import MyWishList     from '@/components/Wish/MyWishList.vue'
import GroupWishLists from '@/components/Wish/GroupWishLists.vue'
import Groups         from '@/components/Content/Groups.vue'

import Login          from '@/components/Login.vue'
import Profile        from '@/components/Profile.vue'
import AdminReport    from '@/components/Admin/AdminReport.vue'

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
    {path: '/privacy',          name: 'privacy',          component: PrivacyPolicy,  meta: {allowAnonymous: true} },
    {path: '/data-deletion',    name: 'data-deletion',    component: DataDeletion,   meta: {allowAnonymous: true} },
    {path: '/login',            name: 'login',            component: Login,          meta: {allowAnonymous: true} },
    {path: '/feelin-lucky',     name: 'share-the-meal',   component: ShareTheMeal,   meta: {allowAnonymous: true} },
    {path: '/profile',          name: 'profile',          component: Profile,        },
    {path: '/groups',           name: 'groups',           component: Groups,         },
    {path: '/my-wish-list',     name: 'my-wish-list',     component: MyWishList,     },
    {path: '/group-wish-lists', name: 'group-wish-lists', component: GroupWishLists, },
    {path: '/admin/report',     name: 'admin-report',     component: AdminReport,    },
  ]
})

const SESSION_TTL_MS = 2 * 60 * 1000  // re-validate server session every 2 minutes

router.beforeEach(async (to, from, next) => {
  if (to.meta.allowAnonymous) {
    return next()
  }

  // Re-validate the server session if it's been more than 2 minutes since the last check
  const stale = Date.now() - store.state.sessionValidatedAt > SESSION_TTL_MS
  if (stale) {
    await store.dispatch('fetchCurrentUser')
  }

  if (!store.state.vuex_isAuthenticated) {
    next({ path: '/login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router