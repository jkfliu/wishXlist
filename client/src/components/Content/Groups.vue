<template>
  <div id="groups-page" class="small-container">
    <h3>My Groups</h3>
    <p><i>Add yourself to a Group to share your Wish List</i>
    <br><i>Adding to the Public group means everyone can see your wishes</i></p>

    <section class="group-create">
      <h5>Create a New Group</h5>
      <input v-model="newGroupName" type="text" placeholder="Group name" />
      <button @click="createGroup">Create</button>
    </section>

    <section class="group-join">
      <h5>Join a Group</h5>
      <input v-model="joinCode" type="text" placeholder="Invite code" />
      <button @click="joinGroup">Join</button>
      <span v-if="!isInPublicGroup"> or <button @click="joinGroup('PUBLIC')">Join default Public Group</button></span>
    </section>

    <section class="group-list">
      <h5>Your Groups</h5>
      <table v-if="groups.length">
        <thead>
          <tr>
            <th>Group Name</th>
            <th>Invite Code</th>
            <th>Members</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="group in sortedGroups" :key="group._id">
            <td>{{ group.name }}</td>
            <td>
              <div v-if="group.inviteCode !== 'PUBLIC'" class="members-header">
                <input type="text" :value="group.inviteCode" readonly class="invite-code-input" />
                <button class="icon-btn" @click="copyUrl(group.inviteCode)" title="Copy invite URL">
                  <i class="fas fa-copy"></i>
                </button>
              </div>
              <span v-else>—</span>
            </td>
            <td v-if="group.inviteCode !== 'PUBLIC'">
              <div class="members-header">
                <span>{{ group.members.length }}</span>
                <button class="icon-btn" @click="toggleMembers(group._id)" :title="showingMembersFor === group._id ? 'Hide members' : 'Show members'">
                  <i :class="showingMembersFor === group._id ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                </button>
              </div>
              <div v-if="showingMembersFor === group._id" class="member-list">
                <div v-for="member in group.members" :key="member">{{ member }}</div>
              </div>
            </td>
            <td v-else>—</td>
            <td>
              <button @click="leaveGroup(group._id)">Leave</button>
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
        groups:            [],
        newGroupName:      '',
        joinCode:          '',
        showingMembersFor: null,
      }
    },

    computed: {
      isInPublicGroup() {
        return this.groups.some(g => g.inviteCode === 'PUBLIC')
      },
      sortedGroups() {
        return [...this.groups].sort((a, b) => (a.inviteCode === 'PUBLIC' ? -1 : b.inviteCode === 'PUBLIC' ? 1 : 0))
      },
    },

    async mounted() {
      await this.fetchGroups()
      const code = this.$route.query.join
      if (code && !this.groups.some(g => g.inviteCode === code)) {
        await this.joinGroup(code)
      }
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

      async joinGroup(code = this.joinCode) {
        if (!code) return
        try {
          const response = await fetch('/Groups/Join', {
            method:      'POST',
            credentials: 'include',
            headers:     { 'Content-type': 'application/json; charset=UTF-8' },
            body:        JSON.stringify({ inviteCode: code }),
          })
          if (!response.ok) throw new Error(`Server error: ${response.status}`)
          const data = await response.json()
          if (!this.groups.some(g => g._id === data._id)) {
            this.groups = [...this.groups, data]
          }
          if (code === this.joinCode) this.joinCode = ''
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

      inviteUrl(inviteCode) {
        return `${window.location.origin}/groups?join=${inviteCode}`
      },

      copyUrl(inviteCode) {
        navigator.clipboard.writeText(this.inviteUrl(inviteCode))
      },

      toggleMembers(groupId) {
        this.showingMembersFor = this.showingMembersFor === groupId ? null : groupId
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

  .members-header {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .icon-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    margin: 0;
    color: inherit;
    line-height: 1;
    vertical-align: middle;
    display: inline-flex;
    align-items: center;
  }

  .invite-code-input {
    width: 7rem;
    font-family: monospace;
    font-size: 0.875rem;
    border: 1px solid #ddd;
    background: #f5f5f5;
    padding: 2px 4px;
    margin: 0;
    cursor: default;
    vertical-align: middle;
  }

  .member-list {
    margin-top: 0.25rem;
    font-size: 0.875rem;
    color: #555;
  }
</style>
