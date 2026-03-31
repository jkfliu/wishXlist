<template>
  <div>
    <div class="sidebar">
      <router-link :to="{ name: 'my-wish-list'     }">My Wish List  </router-link>
      <router-link :to="{ name: 'groups'           }">My Groups     </router-link>
      <router-link :to="{ name: 'group-wish-lists' }">View All Lists</router-link>
      <router-link :to="{ name: 'share-the-meal'   }">Feelin' Lucky?</router-link>
      <router-link :to="{ name: 'about'            }">About         </router-link>
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
    background-color: #eee;     /* Grey background color */
    overflow:           auto;
    border-radius:      0.25em;
    flex:               1;        /* take up the full height of the container */
  }

  .sidebar a {
    background-color: #eee;     /* Grey background color */
    color:            black;    /* Black text color */
    display:            block;    /* Make the links appear below each other */
    padding:            12px;     /* Add some padding */
    text-decoration:    none;     /* Remove underline from links */
  }

  .sidebar a:hover {
    background-color: #ccc;     /* Dark grey background on mouse-over */
  }

  .sidebar a.active {
    background-color: #3972bd;  /* Add a green color to the "active/current" link */
    color:            white;
  }
</style>
