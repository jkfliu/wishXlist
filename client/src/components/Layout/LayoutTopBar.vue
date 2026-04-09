<template>
  <div class="topnav">
    <div class="menu-left">
      <router-link :to="{name: 'home'}">
        <img src="/wish_X_list.logo.jpg" alt="wishXlist" height="80" align="center">
      </router-link>
    </div>

    <div class="menu-right">
      <!-- If user is authenticated, display user welcome msg + link to profile + logout button -->
      <div v-if="$store.state.vuex_isAuthenticated" class="user-menu">
        <span class="welcome-text">Welcome back<router-link :to="{name: 'profile'}">{{ $store.state.vuex_displayName || $store.state.vuex_globalUser }}</router-link></span>
        <a href="#" @click.prevent="confirmLogout" class="logout-link" title="Logout">
          <i class="fas fa-sign-out-alt"></i>
        </a>
      </div>
      <!-- If not authenticated and not on the login page, show login icon -->
      <div v-else-if="$route.name !== 'login'">
        <router-link :to="{ name: 'login' }" title="Login">
          <i class="fas fa-user-circle fa-2x"></i>
        </router-link>
      </div>
    </div>

  </div>
</template>

<script>
  export default {
    name: 'layout-top-bar',

    methods: {
      async confirmLogout() {
        if (!confirm('Are you sure you want to log out?')) return
        await fetch('/Auth/Logout', { method: 'POST', credentials: 'include' })
        this.$router.push({ name: 'login', query: { logout: true } }).catch(() => {})
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
    padding:        12px 8px 0 0;
  }

  .topnav a {
    color:        black;
    padding:        4px 4px;
    border-radius:  0.25em;
    margin-right:   .25rem;
    font-weight:    bold;
  }

  .user-menu {
    display:        flex;
    flex-direction: column;
    align-items:    flex-end;
  }

  .logout-link {
    cursor: pointer;
  }
@media (max-width: 600px) {
    .topnav img {
      height: 48px;
    }
    .welcome-text {
      display: none;
    }
  }
</style>
