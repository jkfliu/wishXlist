<template>
  <div id="GroupWishLists" class="small-container">
    <h3>Group Wish Lists</h3>
    <i>View Group Wish Lists and select items to gift!</i>

    <div v-if="groups.length > 1" class="group-selector">
      <label for="group-select">Viewing Group: </label>
      <select id="group-select" v-model="selectedGroupId" @change="loadWishListForGroup">
        <option v-for="g in groups" :key="g._id" :value="g._id">{{ g.name }}</option>
      </select>
    </div>
    <p v-else-if="groups.length === 1" class="group-label">
      Viewing: <strong>{{ groups[0].name }}</strong>
    </p>

    <!-- Pass down the array to the child component -->
    <p v-if="loading"><i class="fas fa-spinner fa-spin"></i> Loading...</p>
    <wish-list-table
      v-else
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
        loading:         true,
        wish_list_array: [],
        display_mode:    'group',
        selectedGroupId: null,
      }
    },

    computed: {
      groups() {
        return this.$store.state.groups
      },
    },

    async mounted() {
      if (!this.groups.length) return
      this.selectedGroupId = this.groups[0]._id
      await this.loadWishListForGroup()
    },

    methods: {
      async loadWishListForGroup() {
        if (!this.selectedGroupId) return
        const cached = this.$store.state.groupWishListCache[this.selectedGroupId]
        const fresh  = cached && (Date.now() - cached.fetchedAt < 2 * 60 * 1000)
        if (fresh) {
          this.wish_list_array = cached.items
          this.loading = false
          return
        }
        this.loading = true
        try {
          const res = await fetch(`/WishList?groupId=${this.selectedGroupId}`, { credentials: 'include' })
          if (!res.ok) throw new Error(`Server error: ${res.status}`)
          this.wish_list_array = await res.json()
          this.$store.commit('set_group_wish_list_cache', { groupId: this.selectedGroupId, items: this.wish_list_array })
        } catch (error) {
          console.error(error)
          alert('loadWishListForGroup(): Unable to retrieve Wish List items. Please contact Support')
        } finally {
          this.loading = false
        }
      },

      async giftWishItem(updated_wish_item) {
        if (confirm('Are you sure you want to gift this item?\n(This action cannot be undone)')) {
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
            this.$store.commit('set_group_wish_list_cache', { groupId: this.selectedGroupId, items: this.wish_list_array })
          } catch (error) {
            console.error(error)
            alert("giftWishItem(): Unable to gift this Wish List item. Please contact Support")
          }
        }
      },

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

  .group-selector,
  .group-label {
    margin: 0.75rem 0;
  }
</style>
