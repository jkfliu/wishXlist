<template>
  <div id="MyWishList" class="small-container">
    <h3>Wish List</h3>
    <i>Create your wish list and start sharing!</i>
    <wish-item-form @add:wish_item="addWishItem"/>
    <!-- Pass down the array to the child component -->
    <wish-list-table 
      v-bind:wish_list_array="wish_list_array"
      v-bind:display_mode   ="display_mode"  
      @delete:wish_item     ="deleteWishItem"
      @edit:wish_item       ="editWishItem"/>
    <br>
  </div>
</template>

<script>
  import WishItemForm  from '@/components/Wish/_WishItemForm.vue'
  import WishListTable from '@/components/Wish/_WishList.vue'

  export default {
    name: 'MyWishList',

    components: {
      WishItemForm,
      WishListTable,
    },
    
    data() {
      // Defined as a function to return the data object when initiated
      return {
        wish_list_array: [],
        display_mode:    'self',
      }
    },

    mounted() {
      // Called upon initialisation
      this.getWishList(this.$store.state.vuex_globalUser)
    },

    methods: {
      // Retrieve Wish List
      async getWishList(user) {
        console.log('Executing MyWishList.vue getWishList() for ' + user)
        try {
          const response = await fetch('http://localhost:3000/WishList/' + user)
          const data     = await response.json()
          this.wish_list_array = data
        } catch (error) {
          console.error(error)
          alert("getWishList(): Unable to retrieve Wish List items. Please contact Support")
        }
      },

      // Add an new wish list item
      async addWishItem(wish_item) {
        wish_item.user_name = this.$store.state.vuex_globalUser // Use Vuex store
        console.log('Executing MyWishList.vue addWishItem()')
        try {
          const response = await
          fetch('http://localhost:3000/WishList/create', {
            method:    'POST',
            body:       JSON.stringify(wish_item),
            headers: { 'Content-type': 'application/json; charset=UTF-8' }
          }) 
          const data = await response.json()
          this.wish_list_array = [...this.wish_list_array, data]
        } catch (error) {
          console.error(error)
          alert("addWishItem(): Unable to add Wish List item. Please contact Support")
        }
      },

      // Edit an existing wish list item
      async editWishItem(updated_wish_item) {
        console.log('Executing MyWishList.vue editWishItem() for ' + updated_wish_item)
        try {
          const response = await
          fetch('http://localhost:3000/WishList/update', {
            method:    'POST',
            body:       JSON.stringify(updated_wish_item),
            headers: { 'Content-type': 'application/json; charset=UTF-8' },
          }) 
          await response.json()
          this.wish_list_array = this.wish_list_array.map(
            wish_item => wish_item._id === updated_wish_item._id ? updated_wish_item : wish_item
          )
        } catch (error) {
          console.error(error)
          alert("editWishItem(): Unable to edit Wish List item. Please contact Support")
        }
      },

      // Delete an existing wish list item
      // Ideally this should be a pop-up for user to confirm before deleting
      async deleteWishItem(wish_item_id) {
        if (confirm('Are you sure you want to delete this?\n(This action cannot be undone)')) {
          console.log('Executing App.vue deleteWishItem() for wish_item_id ' + wish_item_id)
          try {
            const response = await
            fetch(`http://localhost:3000/WishList/delete/${wish_item_id}`, {
              method:    'POST'
            })
            await response.json()
            this.wish_list_array = this.wish_list_array.filter(
              wish_item => wish_item._id !== wish_item_id 
            )
          } catch (error) {
            console.error(error)
            alert("deleteWishItem(): Unable to delete Wish List item. Please contact Support")
          }
        }
      }

    } // End of methods()

  } // End of export
</script>

<style scoped>
  /* Enter local styles here */
</style>