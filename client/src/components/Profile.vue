<template>
  <div id="profile-view" class="small-container">
    <h3>wishXlist - Profile</h3>
    <div>
      <label>Email:</label> {{ username }}
      <br />
      <label>Display Name:</label> {{ displayName || '—' }}
      <br />
      <label>Avatar:</label> Coming soon!
    </div>
    <p>
    <div>
      <input type="button" value="Logout" v-on:click="logout" />
    </div>
  </div>
</template>

<script>
  export default {
    name: 'Profile',

    data() {
      return {
        username:    this.$store.state.vuex_globalUser,
        displayName: '',
      }
    },

    async created() {
      try {
        const res = await fetch('/Auth/Me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          this.displayName = data.displayName;
        }
      } catch (err) {
        console.error(err);
      }
    },

    methods: {
      async logout() {
        try {
          await fetch('/Auth/Logout', { method: 'POST', credentials: 'include' });
        } catch (err) {
          console.error(err);
        }
        this.$store.dispatch('logout')
        this.$router.push('/login?logout=true');
      }
    }
  }
</script>

<style scoped>
  /* Enter local styles here */
</style>
