<template>
  <div class="sidebar" :class="{ collapsed: !$store.state.navVisible }">
    <router-link :to="{ name: 'my-wish-list'     }" title="My Wish List">
      <i class="fas fa-list"></i><span>My Wish List</span>
    </router-link>
    <router-link :to="{ name: 'groups'           }" title="My Groups">
      <i class="fas fa-users"></i><span>My Groups</span>
    </router-link>
    <router-link :to="{ name: 'group-wish-lists' }" title="View Wish Lists">
      <i class="fas fa-eye"></i><span>View Wish Lists</span>
    </router-link>
    <router-link :to="{ name: 'share-the-meal'   }" title="Feelin' Lucky?">
      <i class="fas fa-random"></i><span>Feelin' Lucky?</span>
    </router-link>
    <router-link :to="{ name: 'about'            }" title="About">
      <i class="fas fa-info-circle"></i><span>About</span>
    </router-link>
    <router-link v-if="isAdmin" :to="{ name: 'admin-report' }" title="Admin Stats">
      <i class="fas fa-chart-line"></i><span>Admin Stats</span>
    </router-link>
    <button class="toggle-btn nav-item" @click="$store.commit('toggle_nav_visible')" :title="$store.state.navVisible ? 'Collapse' : 'Expand'">
      <i :class="$store.state.navVisible ? 'fas fa-chevron-left' : 'fas fa-chevron-right'"></i><span>Collapse</span>
    </button>
  </div>
</template>

<script>
  export default {
    name: 'layout-side-bar',
    computed: {
      isAdmin() {
        return this.$store.state.vuex_isAdmin
      },
    },
  }
</script>

<style scoped>
  .sidebar {
    background-color: #eee;
    overflow:         hidden;
    border-radius:    0.25em;
    flex:             1;
  }

  /* Shared base styles for all nav items (links + toggle button) */
  .sidebar a,
  .nav-item {
    background-color: #eee;
    color:            black;
    display:          flex;
    align-items:      center;
    gap:              10px;
    padding:          12px;
    white-space:      nowrap;
    overflow:         hidden;
  }

  .sidebar a {
    text-decoration: none;
  }

  .sidebar a i,
  .nav-item i {
    min-width:   16px;
    text-align:  center;
    flex-shrink: 0;
  }

  .sidebar a span,
  .nav-item span {
    opacity:    1;
    transition: opacity 0.15s ease;
  }

  .sidebar a:hover,
  .nav-item:hover {
    background-color: #ccc;
  }

  .sidebar a.active {
    background-color: #3972bd;
    color:            white;
  }

  .sidebar.collapsed a,
  .sidebar.collapsed .nav-item {
    justify-content: center;
    gap:             0;
  }

  .sidebar.collapsed a span,
  .sidebar.collapsed .nav-item span {
    opacity: 0;
    width:   0;
  }

  /* Toggle button resets */
  .toggle-btn {
    border:     none;
    width:      100%;
    cursor:     pointer;
    font-size:  1rem;
  }
</style>
