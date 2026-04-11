<template>
  <div class="small-container">
    <h3>About wishXlist</h3>
    <br>You're currently viewing wishXlist <i>beta</i> version.
    <br>
    <br>Please send feedback/suggestions to <a href="mailto:jkfliu@gmail.com?subject=wishXlist Feedback">Jason Liu</a>.
    <br>
    <br>Here's the ongoing TODO list:
      <ul>
        <li>(Done) Allowing wish list items to be group-specific</li>
        <li>(Done) Implemented DB indexing and Vuex cacheing</li>
        <li>(Done) Generate weekly usage metrics/stats (Admin-only)</li>
      </ul>
   
  </div>
</template>

<script>
  export default {
    name: 'about-wishxlist'
  }
</script>

<style scoped>
  .small-container {
    margin-left: 0;
  }

  h3 {
    margin-top: 0;
  }
</style>