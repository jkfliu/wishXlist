<template>
  <div id="wish-item-form" class="card">
    <form @submit.prevent="handleSubmit">
      <table class="form-table">
        <tbody>
          <tr>
            <td><label>Item Name*</label></td>
            <td><input
              v-model="wish_item.item_name" type="text"
              :class="{'has-error': submitting && invalidName}"
              @focus="clearStatus" @keypress="clearStatus"
              ref="firstEntry" /></td>
          </tr>
          <tr>
            <td><label>Model</label></td>
            <td><input v-model="wish_item.model" type="text" /></td>
          </tr>
          <tr>
            <td><label>Price</label></td>
            <td><input v-model.number="wish_item.price" type="number" min="0" step="0.01" /></td>
          </tr>
          <tr>
            <td><label>Store / URL</label></td>
            <td><input v-model="wish_item.store" type="text" /></td>
          </tr>
        </tbody>
      </table>

      <div v-if="groups.length" class="group-visibility">
        <label>Visible to the following Groups (at least one):</label>
        <label v-for="g in groups" :key="g._id" class="group-checkbox-label">
          <input
            type="checkbox"
            :value="g._id"
            v-model="selectedGroupIds"
            :disabled="selectedGroupIds.length === 1 && selectedGroupIds.includes(g._id)"
          />
          {{ g.name }}
        </label>
      </div>

      <p v-if="submitting && invalidName" class="error-message">❗Please fill out all required fields</p>
      <p v-if="submitting && invalidGroups" class="error-message">❗Please select at least one group</p>
      <p v-if="success" class="success-message">
       ✅ Wish item successfully added</p>
      <button>Add Item</button>
    </form>
  </div>
</template>

<script>
  export default {
    name: 'wish-item-form',

    props: {
      groups: {
        type: Array,
        default: () => [],
      },
    },

    data() {
      return {
        submitting:       false,
        error:            false,
        success:          false,
        selectedGroupIds: [],
        wish_item: {
          user_name:        '',
          item_name:        '',
          model:            '',
          price:            null,
          store:            '',
          item_create_date: '',
        },
      }
    },

    created() {
      this.selectedGroupIds = this.groups.map(g => g._id)
    },

    watch: {
      groups(newGroups) {
        this.selectedGroupIds = newGroups.map(g => g._id)
      },
    },

    computed: {
      invalidName() {
        return this.wish_item.item_name === ''
      },
      invalidGroups() {
        return this.groups.length > 0 && this.selectedGroupIds.length === 0
      },
    },

    methods: {
      handleSubmit() {
        this.submitting = true
        this.clearStatus()

        if (this.invalidName || this.invalidGroups) {
          this.error = true
          return
        }

        this.wish_item.user_name        = this.$store.state.vuex_globalUser
        this.wish_item.item_create_date = new Date().toUTCString()
        this.wish_item.visibleToGroups  = this.selectedGroupIds.length === this.groups.length
          ? []
          : [...this.selectedGroupIds]

        this.$emit('add:wish_item', this.wish_item)

        this.$refs.firstEntry.focus()

        this.wish_item = {
          user_name:        '',
          item_name:        '',
          model:            '',
          price:            null,
          store:            '',
          item_create_date: '',
        }
        this.selectedGroupIds = this.groups.map(g => g._id)
        this.submitting = false
        this.error      = false
        this.success    = true
      },

      clearStatus() {
        this.error   = false
        this.success = false
      }
    },
  }
</script>

<style scoped>
  #wish-item-form {
    margin-bottom: 1.5rem;
  }
  .form-table {
    border-collapse: collapse;
    margin-bottom: 0.5rem;
  }
  .form-table td {
    padding: 3px 8px 3px 0;
    vertical-align: middle;
    border-bottom: none;
  }
  .form-table td:first-child {
    white-space: nowrap;
    width: 1%;
  }
  .form-table label {
    margin: 0;
  }
  .form-table input {
    padding: 5px 4px;
    vertical-align: middle;
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
  .group-visibility {
    margin: 1rem 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
  }
  .group-visibility > label:first-child {
    width: 100%;
    margin: 0;
    padding: 0;
  }
</style>
