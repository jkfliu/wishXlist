<template>
  <div class="topnav">
    <div class="menu-left">
      <button class="nav-toggle-btn" @click="$store.commit('toggle_nav_visible')" title="Toggle navigation">&#9776;</button>
      <router-link :to="{name: 'home'}">
        <img src="wish_X_list.logo.jpg" alt="wishXlist" height="80" align="center">
      </router-link>
    </div>

    <div class="menu-right">
      <!-- If user is authenticated, display user welcome msg + link to profile + logout button -->
      <span v-if="this.$store.state.vuex_isAuthenticated">
        Welcome back <router-link :to="{name: 'profile'}">{{ this.$store.state.vuex_globalUser }}</router-link>
        <a href="#" @click.prevent="confirmLogout" class="logout-link" title="Logout">
          <i class="fas fa-sign-out-alt fa-2x"></i> Logout
        </a>
      </span>
      <!-- If user is not authenticated, display login icon -->
      <span v-else>
        <router-link :to="{name: 'login'}"><i class="fas fa-file-import fa-2x" title="Login"></i></router-link>
      </span>
    </div>

  </div>
</template>

<script>
  export default {
    name: 'layout-top-bar',

    methods: {
      confirmLogout() {
        if (confirm('Are you sure you want to log out?')) {
          this.$router.push({ name: 'login', query: { logout: true } })
        }
      },
    }
  }
</script>

<style scoped>
  .topnav {
    overflow:       hidden;
    display:        flex;
  }

  .topnav .menu-right {
    margin-left:    auto;
    padding:        4px;
  }

  .topnav a {
    color:        black;
    padding:        4px 4px;
    border-radius:  0.25em;
    margin-right:   .25rem;
    font-weight:    bold;
  }

  .logout-link {
    cursor: pointer;
  }
  .nav-toggle-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 4px 8px;
    margin-right: 4px;
    vertical-align: middle;
  }
</style>
