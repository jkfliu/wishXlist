<template>
  <div id="MyWishList" class="small-container">
    <h3>Wish List</h3>
    <i>Create your Wish List and start sharing!</i>
    <wish-item-form :groups="groups" @add:wish_item="addWishItem"/>
    <!-- Pass down the array to the child component -->
    <i>Your current Wish List:</i> 
    <wish-list-table
      :wish_list_array="wish_list_array"
      :display_mode="display_mode"
      :groups="groups"
      @delete:wish_item="deleteWishItem"
      @edit:wish_item="editWishItem"/>
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
      return {
        wish_list_array: [],
        display_mode:    'self',
      }
    },

    computed: {
      groups() {
        return this.$store.state.groups
      },
    },

    async mounted() {
      const username = this.$store.state.vuex_globalUser
      const cached   = this.$store.state.wishListCache[username]
      if (cached) {
        this.wish_list_array = cached
      } else {
        await this.getWishList(username)
      }
    },

    methods: {
      async getWishList(user) {
        try {
          const response    = await fetch('/WishList/' + user, { credentials: 'include' })
          const data        = await response.json()
          const displayName = this.$store.state.vuex_displayName
          this.wish_list_array = data.map(item => ({ ...item, displayName }))
          this.$store.commit('set_wish_list_cache', { username: user, items: this.wish_list_array })
        } catch (error) {
          console.error(error)
          alert("getWishList(): Unable to retrieve Wish List items. Please contact Support")
        }
      },

      async addWishItem(wish_item) {
        wish_item.user_name = this.$store.state.vuex_globalUser
        try {
          const response = await fetch('/WishList', {
            method:    'POST',
            body:       JSON.stringify(wish_item),
            headers: { 'Content-type': 'application/json; charset=UTF-8' }
          })
          if (!response.ok) throw new Error(`Server error: ${response.status}`)
          const data = await response.json()
          this.wish_list_array = [...this.wish_list_array, { ...data, displayName: this.$store.state.vuex_displayName }]
          this.$store.commit('set_wish_list_cache', { username: wish_item.user_name, items: this.wish_list_array })
        } catch (error) {
          console.error(error)
          alert("addWishItem(): Unable to add Wish List item. Please contact Support")
        }
      },

      async editWishItem(updated_wish_item) {
        try {
          const response = await fetch(`/WishList/${updated_wish_item._id}`, {
            method:    'PUT',
            body:       JSON.stringify(updated_wish_item),
            headers: { 'Content-type': 'application/json; charset=UTF-8' },
          })
          if (!response.ok) throw new Error(`Server error: ${response.status}`)
          await response.json()
          this.wish_list_array = this.wish_list_array.map(
            wish_item => wish_item._id === updated_wish_item._id ? updated_wish_item : wish_item
          )
          this.$store.commit('set_wish_list_cache', { username: this.$store.state.vuex_globalUser, items: this.wish_list_array })
        } catch (error) {
          console.error(error)
          alert("editWishItem(): Unable to edit Wish List item. Please contact Support")
        }
      },

      async deleteWishItem(wish_item_id) {
        if (confirm('Are you sure you want to delete this?\n(This action cannot be undone)')) {
          try {
            const response = await fetch(`/WishList/${wish_item_id}`, {
              method: 'DELETE'
            })
            if (!response.ok) throw new Error(`Server error: ${response.status}`)
            await response.json()
            this.wish_list_array = this.wish_list_array.filter(
              wish_item => wish_item._id !== wish_item_id
            )
            this.$store.commit('set_wish_list_cache', { username: this.$store.state.vuex_globalUser, items: this.wish_list_array })
          } catch (error) {
            console.error(error)
            alert("deleteWishItem(): Unable to delete Wish List item. Please contact Support")
          }
        }
      }

    }

  }
</script>

<style scoped>
  .small-container {
    margin-left: 0;
  }

  h3 {
    margin-top: 0;
  }
</style>