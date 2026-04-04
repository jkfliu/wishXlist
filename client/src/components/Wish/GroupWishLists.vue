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
        groups:          [],
        selectedGroupId: null,
      }
    },

    async mounted() {
      try {
        // Fetch groups and wish list in parallel — no dependency between them on initial load
        const [groupsRes, wishRes] = await Promise.all([
          fetch('/Groups', { credentials: 'include' }),
          fetch('/WishList', { credentials: 'include' }),
        ])
        if (!groupsRes.ok) throw new Error(`Server error: ${groupsRes.status}`)
        if (!wishRes.ok)   throw new Error(`Server error: ${wishRes.status}`)
        const [groups, allItems] = await Promise.all([groupsRes.json(), wishRes.json()])

        this.groups = groups
        if (!groups.length) return
        this.selectedGroupId = groups[0]._id

        // Only members fetch remains after groups are known
        const mRes = await fetch(`/Groups/Members?groupId=${this.selectedGroupId}`, { credentials: 'include' })
        if (!mRes.ok) throw new Error(`Server error: ${mRes.status}`)
        const { members } = await mRes.json()

        const user = this.$store.state.vuex_globalUser
        this.wish_list_array = allItems.filter(item =>
          members.includes(item.user_name) &&
          item.user_name !== user &&
          (!item.visibleToGroups?.length || item.visibleToGroups.includes(this.selectedGroupId))
        )
      } catch (error) {
        console.error(error)
        alert('Unable to load Group Wish Lists. Please contact Support')
      }
    },

    methods: {
      async loadWishListForGroup() {
        if (!this.selectedGroupId) return
        try {
          const [mRes, wRes] = await Promise.all([
            fetch(`/Groups/Members?groupId=${this.selectedGroupId}`, { credentials: 'include' }),
            fetch('/WishList', { credentials: 'include' }),
          ])
          if (!mRes.ok) throw new Error(`Server error: ${mRes.status}`)
          if (!wRes.ok) throw new Error(`Server error: ${wRes.status}`)
          const [{ members }, data] = await Promise.all([mRes.json(), wRes.json()])

          const user = this.$store.state.vuex_globalUser
          this.wish_list_array = data.filter(item =>
            members.includes(item.user_name) &&
            item.user_name !== user &&
            (!item.visibleToGroups?.length || item.visibleToGroups.includes(this.selectedGroupId))
          )
        } catch (error) {
          console.error(error)
          alert('loadWishListForGroup(): Unable to retrieve Wish List items. Please contact Support')
        }
      },

      async giftWishItem(updated_wish_item) {
        if (confirm('Are you sure you want to gift this item?\n(This action cannot be undone)')) {
          try {
            const response = await fetch('/WishList/Update', {
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
