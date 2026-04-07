<template>
  <div>
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
      <button class="toggle-btn" @click="$store.commit('toggle_nav_visible')" :title="$store.state.navVisible ? 'Collapse' : 'Expand'">
        <i :class="$store.state.navVisible ? 'fas fa-chevron-left' : 'fas fa-chevron-right'"></i><span>Collapse</span>
      </button>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'layout-side-bar',
  }
</script>

<style scoped>
  .sidebar {
    background-color: #eee;
    overflow:         hidden;
    border-radius:    0.25em;
    flex:             1;
  }

  .sidebar a {
    background-color: #eee;
    color:            black;
    display:          flex;
    align-items:      center;
    gap:              10px;
    padding:          12px;
    text-decoration:  none;
    white-space:      nowrap;
    overflow:         hidden;
  }

  .sidebar a i {
    min-width:   16px;
    text-align:  center;
    flex-shrink: 0;
  }

  .sidebar a span {
    opacity:    1;
    transition: opacity 0.15s ease;
  }

  .sidebar.collapsed a {
    justify-content: center;
    gap:             0;
  }

  .sidebar.collapsed a span {
    opacity: 0;
    width:   0;
  }

  .sidebar a:hover {
    background-color: #ccc;
  }

  .sidebar a.active {
    background-color: #3972bd;
    color:            white;
  }

  .toggle-btn {
    background:      #eee;
    border:          none;
    color:           black;
    display:         flex;
    align-items:     center;
    gap:             10px;
    padding:         12px;
    width:           100%;
    cursor:          pointer;
    white-space:     nowrap;
    overflow:        hidden;
    font-size:       1rem;
  }

  .toggle-btn i {
    min-width:   16px;
    text-align:  center;
    flex-shrink: 0;
  }

  .toggle-btn span {
    opacity:    1;
    transition: opacity 0.15s ease;
  }

  .toggle-btn:hover {
    background-color: #ccc;
  }

  .sidebar.collapsed .toggle-btn {
    justify-content: center;
    gap:             0;
  }

  .sidebar.collapsed .toggle-btn span {
    opacity: 0;
    width:   0;
  }
</style>
