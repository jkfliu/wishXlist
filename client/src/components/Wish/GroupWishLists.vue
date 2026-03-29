<template>
  <div id="GroupWishLists" class="small-container">
    <h3>Group Wish Lists</h3>
    <i>View group Wish Lists and select items to gift!</i>
    <!-- Pass down the array to the child component -->
    <wish-list-table 
      v-bind:wish_list_array="wish_list_array"
      v-bind:display_mode="display_mode"      
      @gift:wish_item="giftWishItem"/>
    <br>
  </div>
</template>

<script>
  import WishListTable from '@/components/Wish/_WishList.vue'

  export default {
    name: 'GroupWishLists',

    components: {
      WishListTable,
    },
    
    data() {
      return {
        wish_list_array: [],
        display_mode:    'group',
      }
    },

    mounted() {
      // Any functions to call upon initialisation?
      this.getWishList()
    },

    methods: {
      // Retrieve Wish Lists
      async getWishList() {
        console.log('Executing GroupWishLists.vue getWishList()')
        try {
          const response = await fetch('http://localhost:3000/WishList/')
          if (!response.ok) throw new Error(`Server error: ${response.status}`)
          const data     = await response.json()
          
          // Filter out user's items from the group's wish list
          // i.e. a user should not be able to gift their own item (?)
          var   user     = this.$store.state.vuex_globalUser
          this.wish_list_array = data.filter(function(item) {
              return item.user_name !== user
          });
        } catch (error) {
          console.error(error)
          alert("getWishList(): Unable to retrieve Wish List items. Please contact Support")
        }
      },

      // Gift an existing wish list item
      async giftWishItem(updated_wish_item) {
        if (confirm('Are you sure you want to gift this item?\n(This action cannot be undone)')) {
          console.log('Executing GroupWishLists.vue giftWishItem() for ' + updated_wish_item)
          try {
            const response = await
            fetch('http://localhost:3000/WishList/Update', {
              method:    'POST',
              body:       JSON.stringify(updated_wish_item),
              headers: { 'Content-type': 'application/json; charset=UTF-8' },
            })
            if (!response.ok) throw new Error(`Server error: ${response.status}`)
            await response.json()
            this.wish_list_array = this.wish_list_array.map(
              wish_item => wish_item._id === updated_wish_item._id ? updated_wish_item : wish_item
            )
          } catch (error) {
            console.error(error)
            alert("giftWishItem(): Unable to gift this Wish List item. Please contact Support")
          }
        }
      },

    } // End of methods()

  } // End of export
</script>

<style scoped>
  .small-container {
    margin-left: 0;
  }

  h3 {
    margin-top: 0;
  }
</style>