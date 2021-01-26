<template>
  <div class="topnav">
    <div class="menu-left">
      <router-link :to="{name: 'home'}">
        <img src="wish_X_list.logo.jpg" alt="wishXlist" height="80" align="center">
      </router-link>
    </div>

    <div class="menu-right">
      <!-- If user is authenticated, display user welcome msg + link to profile + logout icon -->
      <!-- <a href="#" @click.prevent="toggleNav"><i class="fa fa-bars" title="Toggle Nav"></i></a> -->
      <span v-if="this.$store.state.vuex_isAuthenticated">
      Welcome back <router-link :to="{name: 'profile'}">{{ this.$store.state.vuex_globalUser }}</router-link>
      <router-link :to="{name: 'login', query: {logout: true}}"><i class="fas fa-file-export fa-2x" title="Logout"></i></router-link>
      </span>
      <!-- If user is not authenticated, display login icon -->
      <span v-else>
      <router-link :to="{name: 'login'}"><i class="fas fa-file-import fa-2x" title="Login"></i></router-link>
      </span>

      <!-- About wishXlist, moved to LayoutSideBar
      <span>
      <router-link :to="{name: 'about'}"><i class="fa fa-question fa-2x"     title="About"></i></router-link>
      </span>
      -->
    </div>

  </div>
</template>

<script>
  export default {
    name: 'layout-top-bar',

/*
    data() {
      return {
        logged_in_user: this.$store.state.vuex_globalUser,
      }
    },
*/
    methods: {
      toggleNav () {
        this.$eventHub.$emit('toggle-nav')
      },
    }
  }
</script>

<style scoped>
  .topnav {
    overflow:       hidden;
    display:        flex;     /* Flexbox inline-flex */
  }

  .topnav .menu-right {
    margin-left:    auto;
    padding:        4px;
  }

  /* Style the links inside the navigation bar */
  .topnav a {
    color:        black;
    padding:        4px 4px;
    border-radius:  0.25em;
    margin-right:   .25rem;
    font-weight:    bold;
  }
</style>