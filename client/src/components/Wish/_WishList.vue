<template>
  <div id="wish-list-table">
    <p v-if="wish_list_array.length === 0" class="empty-table">No items in your wish list</p> 
    <table v-else>
      <thead>
        <tr>
          <th>User</th>
          <th>Item Name*</th>
          <th>Model</th>
          <th>Price</th>
          <th>Store</th>
          <th>Created Date</th>
          <th>Modified Date</th>
          <th>Gifter</th>
          <th>Gifted Date</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="wish_item in wish_list_array" :key="wish_item._id">
          <!-- If you wish to display the MongoDB _id -->
          <!-- <td> {{ wish_item._id }} </td> -->

          <!-- User name is not editable! -->
          <td> {{ wish_item.user_name }} </td>

          <td v-if="editing === wish_item._id"><input type="text" v-model="wish_item.item_name" /></td>
          <td v-else>{{ wish_item.item_name }}</td>

          <td v-if="editing === wish_item._id"><input type="text" v-model="wish_item.model" /></td>
          <td v-else>{{ wish_item.model }}</td>

          <td v-if="editing === wish_item._id"><input type="text" v-model="wish_item.price" /></td>
          <td v-else>{{ wish_item.price }}</td>

          <td v-if="editing === wish_item._id"><input type="text" v-model="wish_item.store" /></td>
          <td v-else>{{ wish_item.store }}</td>

          <td> {{ toDate(wish_item.item_create_date) }} </td>
          <td> {{ toDate(wish_item.item_modified_date) }} </td>

          <td> {{ wish_item.gifter_user_name }} </td>
          <td> {{ toDate(wish_item.gifted_date) }} </td>

          <td v-if="editing === wish_item._id">
            <i @click="editWishItem(wish_item)" class="far fa-save" title="Save"></i>
            &nbsp; &nbsp; &nbsp;
            <i @click="cancelEdit(wish_item)" class="fas fa-undo" title="Cancel"></i>
          </td>

          <td v-else-if="display_mode === 'self'">
            <template v-if="!wish_item.gifter_user_name">
              <i @click="editMode(wish_item)" class="far fa-edit" title="Edit"></i>
              &nbsp; &nbsp; &nbsp;
            </template>
            <i @click="$emit('delete:wish_item', wish_item._id)" class="far fa-trash-alt" title="Delete"></i>
          </td>

          <!-- ungifted items in group view can be gifted -->
          <td v-else-if="display_mode === 'group' && !wish_item.gifter_user_name">
            <i @click="giftWishItem(wish_item)" class="fa fa-gift" title="Gift"></i>
          </td>
          <td v-else></td>
        </tr>
      </tbody>
    </table>

  </div>
</template>

<script>
  export default {
    name: 'wish-list-table',

    // These are taken as inputs
    props: {
      wish_list_array: Array,
      display_mode:    String,
    },

    data() {
      return {
        // State
        editing: null
      }
    },

    methods: {
      editMode(wish_item) {
        this.cachedWishItem = Object.assign({}, wish_item)
        this.editing = wish_item._id
      },

      cancelEdit(wish_item) {
        Object.assign(wish_item, this.cachedWishItem)
        this.editing = null
      },

      // Local method which does the actual $emit call
      editWishItem(wish_item) {
        if (wish_item.item_name === '') return
        wish_item.item_modified_date = new Date().toUTCString()
        this.$emit('edit:wish_item', wish_item)
        this.editing = null
      },

      // Local method which does the actual $emit call
      giftWishItem(wish_item) {
        wish_item.gifter_user_name = this.$store.state.vuex_globalUser
        wish_item.gifted_date      = new Date().toUTCString()
        this.$emit('gift:wish_item', wish_item)
      },

      toDate(date) {
        if (!date) return ''
        var mydate = new Date(date)
        return mydate.toDateString()
      }
    } 
  }
</script>

<style scoped>
</style>