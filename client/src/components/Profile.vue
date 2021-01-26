<template>
  <div id="profile-view" class="small-container">
    <h3>wishXlist - Profile for {{ this.$store.state.vuex_globalUser }}</h3>
  
    <div>
      <!-- Read-only properties -->
      <label>Username:</label> {{ this.username }}
      <label>Avatar:  </label> Coming soon!
    </div>

    <p>
    <div v-if="!flagChangePassword">
      <label>Password:</label>
      <input type="button"   v-on:click="flagChangePassword=true" value="Change Password"/>
    </div>
    <div v-else>
      <i>To change passwords, please enter your existing + new passwords</i>
      <label>Old Password:</label>
      <input type="password" v-model="old_password"  size="16" required />
      <label>New Password:</label>
      <input type="password" v-model="new_password1" size="16" required />
      <label>Re-enter New Password:</label>
      <input type="password" v-model="new_password2" size="16" required />

      <input type="button"   v-on:click="change_password"        value="Change Password"/> &nbsp;
      <input type="button"   v-on:click="cancel_change_password" value="Cancel"/>
      <div class="error-message" v-if="error_msg!==''">
        <br>Change password error: {{ error_msg }}.
      </div>      
    </div>

  </div>
</template>

<script>  
  export default {
    name:   'Profile',

    data() {
      return {
        username:           this.$store.state.vuex_globalUser,
        flagChangePassword: false,
        old_password:  '',
        new_password1: '',
        new_password2: '',
        error_msg:     '',
      }
    },

    methods: {

      async change_password() {
        try {
          if (this.new_password1!==this.new_password2) {
            this.error_msg = 'New passwords do not match. Kindly re-enter...';
          } else {
            this.error_msg = ''

            const response = await
            fetch('http://localhost:3000/Auth/Change_Password', {
              method:    'POST',
              headers: { 'Content-type': 'application/json; charset=UTF-8' },
              body:       JSON.stringify({
                          username:     this.$store.state.vuex_globalUser, 
                          old_password: this.old_password,
                          new_password: this.new_password1
                        })
            })
          
            const data = await response.json()
            console.log('Profile::change_password: response: ' + JSON.stringify(data))

            if (data.success) {
              alert("Your password has been successfully updated!")
              this.cancel_change_password()
            } else {
              this.error_msg = data.message
            }
          }
         
        } catch (error) {
          console.error(error)
          alert("Profile:: Apologies, technical issues encountered with changing password. Please contact Support")
        }
      }, // End of change_password

      cancel_change_password() {
        // Reset variables
        this.flagChangePassword = false;
        this.old_password  = '';
        this.new_password1 = '';
        this.new_password2 = '';
        this.error_msg     = '';   
      }  // End of cancel_change_password

    }
  }
</script>

<style scoped>
  /* Enter local styles here */
  .error-message {
    color: red
  }
</style>