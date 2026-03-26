<template>
  <layout-overall>
    <!-- Horizontal banner -->
    <div slot="header">
      <layout-top-bar />
    </div>

    <!-- Side navigation -->
    <div slot="nav">
      <layout-side-bar />
    </div>

    <!-- Main content will go here -->
    <div slot="content">
      <router-view></router-view>
    </div>

    <!-- Footer -->
    <div slot="footer">
      <layout-footer />
    </div>
  </layout-overall>
</template>

<script>
  // Import Layout components
  import LayoutOverall from '@/components/Layout/LayoutOverall.vue'
  import LayoutTopBar  from '@/components/Layout/LayoutTopBar.vue'
  import LayoutSideBar from '@/components/Layout/LayoutSideBar.vue'
  import LayoutFooter  from '@/components/Layout/LayoutFooter.vue'

  export default {
    name:   'WishListApp',

    components: {
      LayoutOverall,
      LayoutTopBar,
      LayoutSideBar,
      LayoutFooter,
    },

    created() {
      this.$store.dispatch('fetchCurrentUser');
    },
  }
</script>

<style>
</style>