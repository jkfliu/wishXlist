<template>
  <div class="small-container">
    <h3>wishXlist - Login</h3>
    <div class="info-message" v-if="message">{{ message }}</div>
    <div class="error-message" v-if="error_message">{{ error_message }}</div>
    <p><i>Please login to view Wish Lists or your Groups</i></p>
    <a href="/Auth/OAuth/google" class="oauth-btn google-btn">Sign in with Google</a>
    <a href="/Auth/OAuth/facebook" class="oauth-btn facebook-btn">Continue with Facebook</a>
  </div>
</template>

<script>
  export default {
    name: 'Login',

    data() {
      return {
        message:       '',
        error_message: '',
      }
    },

    async mounted() {
      const query = this.$route.query;

      if (query.logout) {
        this.$store.commit('set_vuex_globalUser', '');
        this.$store.commit('set_vuex_displayName', '');
        this.$store.commit('set_vuex_isAuthenticated', false);
        this.message = 'You have been logged out.';
      }

      // Save redirect destination before the OAuth flow takes the user away
      if (query.redirect) {
        sessionStorage.setItem('postLoginRedirect', query.redirect);
      }

      if (query.oauth_username) {
        const email = decodeURIComponent(query.oauth_username);
        this.$store.commit('set_vuex_globalUser', email);
        this.$store.commit('set_vuex_isAuthenticated', true);
        // Fetch full profile (including displayName) from the server session
        await this.$store.dispatch('fetchCurrentUser');
        const redirect = sessionStorage.getItem('postLoginRedirect') || '/my-wish-list';
        sessionStorage.removeItem('postLoginRedirect');
        this.$router.push(redirect);
      }

      if (query.error === 'oauth_failed') {
        this.error_message = 'Sign-in failed. Please try again.';
      }
    },
  }
</script>

<style scoped>
  .info-message {
    color: green;
    margin-top: 6px;
    margin-bottom: 6px;
  }
  .error-message {
    color: red;
    margin-top: 6px;
    margin-bottom: 6px;
  }
  .oauth-btn {
    display: inline-block;
    margin-top: 10px;
    padding: 8px 16px;
    color: white;
    border-radius: 4px;
    text-decoration: none;
    font-weight: 500;
  }
  .oauth-btn + .oauth-btn {
    margin-left: 10px;
  }
  .google-btn {
    background-color: #4285F4;
  }
  .google-btn:hover {
    background-color: #3367D6;
  }
  .facebook-btn {
    background-color: #1877F2;
  }
  .facebook-btn:hover {
    background-color: #0C63D4;
  }
</style>
