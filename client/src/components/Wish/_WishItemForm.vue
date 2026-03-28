<template>
  <div id="wish-item-form">
    <form @submit.prevent="handleSubmit"> 
      <label>Item Name*</label>
      <input 
        v-model="wish_item.item_name" type="text" 
        :class="{'has-error': submitting && invalidName}"
        @focus="clearStatus" @keypress="clearStatus"
        ref="firstEntry" />

      <label>Model</label>
      <input v-model="wish_item.model" type="text" />

      <label>Price</label>
      <input v-model="wish_item.price" type="text" />

      <label>Store / URL</label>
      <input v-model="wish_item.store" type="text" />

      <p v-if="error && submitting" class="error-message">
       ❗Please fill out all required fields</p>
      <p v-if="success" class="success-message">
       ✅ Wish item successfully added</p>
      <button>Add Item</button>
    </form>
  </div>
</template>

<script>
  export default {
    name: 'wish-item-form',
    
    data() {
      return {
        // Initialise states and variables
        submitting: false,
        error:      false,
        success:    false,
        wish_item: {
          user_name:        '',
          item_name:        '',
          model:            '',
          price:            '',
          store:            '',
          item_create_date: '',
        },
      }
    },

    computed: {
      // Check for blank item names
      invalidName() {
        return this.wish_item.item_name === ''
      },
    },

    methods: {
      // Actions taken upon form submission
      handleSubmit() {
        console.log('New wish item submitted!')

        this.submitting = true
        this.clearStatus()

        if (this.invalidName) {
          this.error    = true
          return
        }

        // Money line!
        this.wish_item.user_name        = this.$store.state.vuex_globalUser
        this.wish_item.item_create_date = new Date().toUTCString()
        this.$emit('add:wish_item', this.wish_item)

        // Reset focus to first input
        this.$refs.firstEntry.focus()

        // Set success status to true and reset the rest of the variables
        this.wish_item = {
          user_name:        '',
          item_name:        '',
          model:            '',
          price:            '',
          store:            '',
          item_create_date: '',
        }
        this.submitting = false
        this.error      = false
        this.success    = true
      },

      clearStatus() {
        this.error      = false
        this.success    = false
      }
    },
  }
</script>

<style scoped>
  form {
    margin-bottom: 2rem;
  }
  [class*='-message'] {
    font-weight: 500;
  }
  .error-message {
    color: #d33c40;
  }
  .success-message {
    color: #32a95d;
  }
</style>