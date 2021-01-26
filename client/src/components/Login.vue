<template>
  <div class="small-container">
    <h3>wishXlist - Login</h3>
      <div class="field">
        <label>Username:</label>
        <input type="text"     v-model="username" size="16" required />
        <br />
      </div>
      <div class="field">
        <label>Password:</label>
        <input type="password" v-model="password" size="16" required />
      </div>
      <div class="field">
        <!-- <input class="submit-btn" type="submit" value="Submit" required /> -->
        <!-- Can we make this work by hitting the 'Enter' button as well? -->
        <input type="button"   v-on:click="login" value="Submit" required />
      </div>
      <div class="error-message" v-if="login_status_code === 401">
        <br>Login error: Please try again.
      </div>
  </div>
</template>

<script>  
  export default {
    name:   'Login',

    data() {
      return {
        username: '',
        password: '',
        login_status_code: 418, // "I'm a teapot" (?!)
      }
    },

    mounted() {
      // If URL route is /login?logout=true
      if (this.$route.query.logout) {
        this.logout()
      }
    },

    methods: {

      // Login
      async login() {
        try {
          const response = await 
          fetch('http://localhost:3000/Auth/Login', {
            method:    'POST',
            headers: { 'Content-type': 'application/json; charset=UTF-8' },
            body:       JSON.stringify({
                          username: this.username, 
                          password: this.password
                        })
          })
          
          const data = await response.json()
          this.login_status_code = response.status
          console.log('login(): Authentication reponse: ' + JSON.stringify(data))

          if (this.login_status_code === 200) { // Successful login
            this.$store.commit('set_vuex_globalUser', data.username);
            this.$store.commit('set_vuex_isAuthenticated', true)
            console.log("Login.vue: vuex: vuex_globalUser " + this.$store.state.vuex_globalUser + ', vuex_isAuthenticated ' + this.$store.state.vuex_isAuthenticated)
            this.$router.push('/my-wish-list');
          } 
          else 
          if (this.login_status_code === 401) { // Incorrect userid/password
            alert("wishXlist: Apologies, " + data.message)
          }
          else 
          { console.error('login(): Status code ' + response.status + ' not trapped!') }

        } catch (error) {
          console.error(error)
          alert("login(): Apologies, technical issues encountered with login. Please contact Support")
        }
      }, // End of login()

      // Logout
      logout() {
        // Reinitilise component variables
        this.username = ''
        this.password = ''
        this.login_status_code = 418 // "I'm a teapot" (?!)        
        
        // Reset Vuex store variables
        this.$store.commit('set_vuex_globalUser', '');
        this.$store.commit('set_vuex_isAuthenticated', false)
      }, // End of logout()

    }
  }
</script>

<style scoped>
  /* Enter local styles here */
  .error-message {
    color: red
  }
</style>