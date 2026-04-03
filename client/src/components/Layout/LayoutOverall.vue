<template>
  <div class="vbox h-100">
    <header>
      <slot name="header">Layout Overall - Header</slot>
    </header>

    <section class="main hbox space-between">
      <nav v-if="$store.state.navVisible">
        <slot name="nav" class="vbox h-100">Layout Overall - Navigation</slot>
      </nav>
      <div
        v-if="$store.state.navVisible"
        class="nav-backdrop"
        @click="$store.commit('toggle_nav_visible')"
      />
      <content>
        <slot name="content">Content here</slot>
      </content>
    </section>

    <footer>
      <slot name="footer">Layout Overall - Footer</slot>
    </footer>
  </div>
</template>

<script>
  export default {
    name: 'layout-overall',

    mounted() {
      this.ensureNavOnLogin(this.$route)
    },

    watch: {
      $route(to) {
        this.ensureNavOnLogin(to)
      }
    },

    methods: {
      ensureNavOnLogin(route) {
        if (window.innerWidth <= 600 && route.name === 'login') {
          this.$store.commit('set_nav_visible', true)
        }
      }
    },
  }
</script>

<style scoped>
  /* items flex/expand vertically */
  .vbox {
    display: -webkit-flex;
    display:    -moz-flex;
    display:     -ms-flex;
    display:         flex;

    -webkit-flex-direction: column;
    -moz-flex-direction:    column;
    -ms-flex-direction:     column;
    flex-direction:         column;
  }

  /* items flex/expand horizontally */
  .hbox {
    display: -webkit-flex;
    display:    -moz-flex;
    display:     -ms-flex;
    display:         flex;

    -webkit-flex-direction: row;
    -moz-flex-direction:    row;
    -ms-flex-direction:     row;
    flex-direction:         row;
  }

  .space-between {
    -webkit-justify-content: space-between;
    -moz-justify-content:    space-between;
    -ms-justify-content:     space-between;
    justify-content:         space-between;
  }

  .h-100 {
    height: 100% !important;
  }

  .viewport {
    /* 23/12> Why doesn't this work? */
    width:  100%;
    height: 100%;
    margin: 0;
  }

  .main {
  -webkit-flex: 1;
  -moz-flex:    1;
  -ms-flex:     1;
  flex:         1;
}

  content {
    -webkit-flex: 5;
    -moz-flex:    5;
    -ms-flex:     5;
    flex:         5;
    overflow:     auto;
    padding:      5px;
  }

  nav {
    -webkit-flex: 1;
    -moz-flex:    1;
    -ms-flex:     1;
    flex:         1;
    overflow:     auto;
  }

  .nav-backdrop {
    display: none;
  }

  @media (max-width: 600px) {
    nav {
      position: fixed;
      top: 0;
      left: 0;
      height: 100%;
      width: 200px;
      z-index: 200;
      background: rgba(238, 238, 238, 0.8);
      flex: none;
    }

    .nav-backdrop {
      display: block;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      z-index: 199;
    }
  }
</style>
