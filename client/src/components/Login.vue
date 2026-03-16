<template>
  <div class="small-container">
    <h3>wishXlist - Login</h3>
    <form @submit.prevent="login">
      <div class="field">
        <label>Username:</label>
        <input type="text" v-model="username" size="16" required autocomplete="username" />
        <br />
      </div>
      <div class="field">
        <label>Password:</label>
        <input type="password" v-model="password" size="16" required autocomplete="current-password" />
      </div>
      <div class="field">
        <input type="submit" :value="loading ? 'Logging in…' : 'Submit'" :disabled="loading" />
      </div>
      <div class="error-message" v-if="error_message">
        {{ error_message }}
      </div>
    </form>
  </div>
</template>

<script>
  export default {
    name: 'Login',

    data() {
      return {
        username:      '',
        password:      '',
        loading:       false,
        error_message: '',
      }
    },

    watch: {
      username() { this.error_message = '' },
      password() { this.error_message = '' },
    },

    mounted() {
      if (this.$route.query.logout) {
        this.logout()
      }
    },

    methods: {

      async login() {
        this.loading = true
        this.error_message = ''
        try {
          const response = await fetch('/Auth/Login', {
            method:  'POST',
            headers: { 'Content-type': 'application/json; charset=UTF-8' },
            body:    JSON.stringify({ username: this.username, password: this.password })
          })

          const data = await response.json()

          if (response.status === 200) {
            this.$store.commit('set_vuex_globalUser', data.username)
            this.$store.commit('set_vuex_isAuthenticated', true)
            const redirect = this.$route.query.redirect || '/my-wish-list'
            this.$router.push(redirect)
          } else if (response.status === 401) {
            this.error_message = 'Incorrect username or password.'
          } else {
            this.error_message = 'Unable to connect. Please try again.'
          }
        } catch (error) {
          console.error(error)
          this.error_message = 'Unable to connect. Please try again.'
        } finally {
          this.loading = false
        }
      },

      logout() {
        this.username      = ''
        this.password      = ''
        this.error_message = ''
        this.$store.commit('set_vuex_globalUser', '')
        this.$store.commit('set_vuex_isAuthenticated', false)
      },

    }
  }
</script>

<style scoped>
  .error-message {
    color: red;
    margin-top: 6px;
  }
</style>
