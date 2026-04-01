<template>
  <div id="wish-list-table">
    <p v-if="wish_list_array.length === 0" class="empty-table">No items in your wish list</p> 
    <table v-else>
      <thead>
        <tr>
          <th>User</th>
          <th data-sort="item_name"  @click="setSort('item_name')">Item Name* {{ sortIndicator('item_name') }}</th>
          <th data-sort="model"      @click="setSort('model')">Model {{ sortIndicator('model') }}</th>
          <th data-sort="price"      @click="setSort('price')">Price {{ sortIndicator('price') }}</th>
          <th data-sort="store"      @click="setSort('store')">Store / URL {{ sortIndicator('store') }}</th>
          <th data-sort="item_create_date" @click="setSort('item_create_date')">Created Date {{ sortIndicator('item_create_date') }}</th>
          <th data-sort="gifter_user_name" @click="setSort('gifter_user_name')">Gifter {{ sortIndicator('gifter_user_name') }}</th>
          <th data-sort="gifted_date" @click="setSort('gifted_date')">Gifted Date {{ sortIndicator('gifted_date') }}</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="wish_item in sortedList" :key="wish_item._id">
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
          <td v-else>
            <a v-if="isUrl(wish_item.store)" :href="wish_item.store" target="_blank" rel="noopener noreferrer">{{ wish_item.store }}</a>
            <span v-else>{{ wish_item.store }}</span>
          </td>

          <td> {{ toDate(wish_item.item_create_date) }} </td>

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
        editing: null,
        sortKey: null,
        sortAsc: true,
      }
    },

    computed: {
      sortedList() {
        if (!this.sortKey) return this.wish_list_array
        const key = this.sortKey
        const asc = this.sortAsc
        return [...this.wish_list_array].sort((a, b) => {
          let vA = a[key] ?? ''
          let vB = b[key] ?? ''
          if (key === 'price') {
            vA = parseFloat(vA) || 0
            vB = parseFloat(vB) || 0
          } else if (key === 'item_create_date' || key === 'item_modified_date' || key === 'gifted_date') {
            vA = vA ? new Date(vA).getTime() : (asc ? Infinity : -Infinity)
            vB = vB ? new Date(vB).getTime() : (asc ? Infinity : -Infinity)
          } else {
            vA = vA.toString().toLowerCase()
            vB = vB.toString().toLowerCase()
          }
          if (vA < vB) return asc ? -1 : 1
          if (vA > vB) return asc ? 1 : -1
          return 0
        })
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
      },

      isUrl(value) {
        try {
          const url = new URL(value)
          return url.protocol === 'http:' || url.protocol === 'https:'
        } catch {
          return false
        }
      },

      setSort(key) {
        if (this.sortKey === key) {
          this.sortAsc = !this.sortAsc
        } else {
          this.sortKey = key
          this.sortAsc = true
        }
      },

      sortIndicator(key) {
        if (this.sortKey !== key) return '↕'
        return this.sortAsc ? '▲' : '▼'
      },
    }
  }
</script>

<style scoped>
  th {
    white-space: nowrap;
  }
</style>
