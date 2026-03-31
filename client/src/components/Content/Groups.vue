<template>
  <div id="groups-page" class="small-container">
    <h3>My Groups</h3>

    <section class="group-create">
      <h4>Create a New Group</h4>
      <input v-model="newGroupName" type="text" placeholder="Group name" />
      <button @click="createGroup">Create</button>
    </section>

    <section class="group-join">
      <h4>Join a Group</h4>
      <input v-model="joinCode" type="text" placeholder="Invite code" />
      <button @click="joinGroup">Join</button>
    </section>

    <section class="group-list">
      <h4>Your Groups</h4>
      <table v-if="groups.length">
        <thead>
          <tr>
            <th>Group Name</th>
            <th>Invite Code</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="group in groups" :key="group._id">
            <td>{{ group.name }}</td>
            <td>
              <span v-if="group.inviteCode !== 'PUBLIC'">
                <code>{{ showingCodeFor === group._id ? group.inviteCode : '••••••••' }}</code>
              </span>
              <span v-else>—</span>
            </td>
            <td>
              <button v-if="group.inviteCode !== 'PUBLIC'" class="show-code-btn" @click="toggleCode(group._id)">
                {{ showingCodeFor === group._id ? 'Hide' : 'Show' }}
              </button>
              &nbsp;
              <button v-if="group.inviteCode !== 'PUBLIC'" @click="leaveGroup(group._id)">Leave</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else>You are not in any groups.</p>
    </section>
  </div>
</template>

<script>
  export default {
    name: 'Groups',

    data() {
      return {
        groups:         [],
        newGroupName:   '',
        joinCode:       '',
        showingCodeFor: null,
      }
    },

    mounted() {
      this.fetchGroups()
    },

    methods: {
      async fetchGroups() {
        try {
          const response = await fetch('/Groups', { credentials: 'include' })
          if (!response.ok) throw new Error(`Server error: ${response.status}`)
          this.groups = await response.json()
        } catch (error) {
          console.error(error)
          alert('fetchGroups(): Unable to retrieve groups. Please contact Support')
        }
      },

      async createGroup() {
        if (!this.newGroupName) return
        try {
          const response = await fetch('/Groups/Create', {
            method:      'POST',
            credentials: 'include',
            headers:     { 'Content-type': 'application/json; charset=UTF-8' },
            body:        JSON.stringify({ name: this.newGroupName }),
          })
          if (!response.ok) throw new Error(`Server error: ${response.status}`)
          const data = await response.json()
          this.groups = [...this.groups, data]
          this.newGroupName = ''
        } catch (error) {
          console.error(error)
          alert('createGroup(): Unable to create group. Please contact Support')
        }
      },

      async joinGroup() {
        if (!this.joinCode) return
        try {
          const response = await fetch('/Groups/Join', {
            method:      'POST',
            credentials: 'include',
            headers:     { 'Content-type': 'application/json; charset=UTF-8' },
            body:        JSON.stringify({ inviteCode: this.joinCode }),
          })
          if (!response.ok) throw new Error(`Server error: ${response.status}`)
          const data = await response.json()
          if (!this.groups.some(g => g._id === data._id)) {
            this.groups = [...this.groups, data]
          }
          this.joinCode = ''
        } catch (error) {
          console.error(error)
          alert('joinGroup(): Unable to join group. Please contact Support')
        }
      },

      async leaveGroup(groupId) {
        if (!confirm('Are you sure you want to leave this group?')) return
        try {
          const response = await fetch('/Groups/Leave', {
            method:      'POST',
            credentials: 'include',
            headers:     { 'Content-type': 'application/json; charset=UTF-8' },
            body:        JSON.stringify({ groupId }),
          })
          if (!response.ok) throw new Error(`Server error: ${response.status}`)
          await response.json()
          this.groups = this.groups.filter(g => g._id !== groupId)
        } catch (error) {
          console.error(error)
          alert('leaveGroup(): Unable to leave group. Please contact Support')
        }
      },

      toggleCode(groupId) {
        this.showingCodeFor = this.showingCodeFor === groupId ? null : groupId
      },
    },
  }
</script>

<style scoped>
  .small-container {
    margin-left: 0;
  }

  h3 {
    margin-top: 0;
  }

  section {
    margin-bottom: 1.5rem;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th, td {
    text-align: left;
    padding: 0.4rem 0.75rem;
    border-bottom: 1px solid #eee;
  }

  th {
    font-weight: 600;
  }
</style>
