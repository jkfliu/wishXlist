<template>
  <div id="groups-page" class="small-container">
    <h3>My Groups</h3>
    <p><i>Join a Group to see the Wish Lists of other members</i>
    <br><i>The Public group is open to everyone — join it to share your Wish List with all other Public members</i></p>

    <section class="group-list card">
      <h5>Your Groups</h5>
      <p v-if="loading"><i class="fas fa-spinner fa-spin"></i> Loading...</p>
      <p v-else-if="fetchError" class="error-text">Unable to load groups. Please refresh the page.</p>
      <table v-else-if="groups.length">
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
                <span class="copy-wrapper">
                  <button class="icon-btn" @click="copyUrl(group.inviteCode)" title="Copy invite URL">
                    <i :class="copiedFor === group.inviteCode ? 'fas fa-check' : 'fas fa-copy'"></i>
                  </button>
                  <span v-if="copiedFor === group.inviteCode" class="copied-tooltip">Copied!</span>
                </span>
                <button class="icon-btn" @click="shareUrl(group.inviteCode)" title="Share invite link">
                  <i class="fas fa-share-alt"></i>
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
              <button v-if="group.inviteCode !== 'PUBLIC' && isAdmin(group)" class="delete-btn" @click="deleteGroup(group._id)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else>You are not in any groups yet.</p>
    </section>

    <div class="card">
      <section class="group-create">
        <h5>Create a New Group</h5>
        <div class="inline-form">
          <input v-model="newGroupName" type="text" placeholder="Group name" />
          <button @click="createGroup">Create</button>
        </div>
      </section>

      <section class="group-join">
        <h5>Join a Group</h5>
        <div class="inline-form">
          <input v-model="joinCode" type="text" placeholder="Invite code" />
          <button @click="joinGroup()">Join</button>
          <span v-if="!isInPublicGroup"> or <button @click="joinGroup('PUBLIC')">Join Public Group</button></span>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'Groups',

    data() {
      return {
        newGroupName:      '',
        joinCode:          '',
        showingMembersFor: null,
        copiedFor:         null,
        copiedTimer:       null,
      }
    },

    computed: {
      groups() {
        return this.$store.state.groups
      },
      loading() {
        return !this.$store.state.groupsLoaded
      },
      fetchError() {
        return this.$store.state.groupsError
      },
      isInPublicGroup() {
        return this.groups.some(g => g.inviteCode === 'PUBLIC')
      },
      sortedGroups() {
        return [...this.groups].sort((a, b) => (a.inviteCode === 'PUBLIC' ? -1 : b.inviteCode === 'PUBLIC' ? 1 : 0))
      },
    },

    async mounted() {
      const code = this.$route.query.join
      if (code && !this.groups.some(g => g.inviteCode === code)) {
        await this.joinGroup(code)
      }
    },

    methods: {

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
          this.newGroupName = ''
          await this.$store.dispatch('fetchGroups')
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
          if (code === this.joinCode) this.joinCode = ''
          await this.$store.dispatch('fetchGroups')
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
          await this.$store.dispatch('fetchGroups')
        } catch (error) {
          console.error(error)
          alert('leaveGroup(): Unable to leave group. Please contact Support')
        }
      },

      inviteUrl(inviteCode) {
        return `${window.location.origin}/groups?join=${inviteCode}`
      },

      async shareUrl(inviteCode) {
        const url  = this.inviteUrl(inviteCode)
        const text = `You're invited to join my wishlist group on wishXlist. Start sharing your wish lists!`
        if (navigator.share) {
          await navigator.share({ title: 'Join wishXlist', text, url })
        } else {
          await this.copyUrl(inviteCode)
        }
      },

      async copyUrl(inviteCode) {
        try {
          await navigator.clipboard.writeText(this.inviteUrl(inviteCode))
          clearTimeout(this.copiedTimer)
          this.copiedFor = inviteCode
          this.copiedTimer = setTimeout(() => { this.copiedFor = null }, 1500)
        } catch (err) {
          console.error('Copy failed:', err)
        }
      },

      isAdmin(group) {
        return group.admins && group.admins.includes(this.$store.state.vuex_globalUser)
      },

      async deleteGroup(groupId) {
        if (!confirm('Are you sure you want to delete this group? This cannot be undone.')) return
        try {
          const response = await fetch('/Groups/Delete', {
            method:      'POST',
            credentials: 'include',
            headers:     { 'Content-type': 'application/json; charset=UTF-8' },
            body:        JSON.stringify({ groupId }),
          })
          if (!response.ok) throw new Error(`Server error: ${response.status}`)
          await this.$store.dispatch('fetchGroups')
        } catch (error) {
          console.error(error)
          alert('deleteGroup(): Unable to delete group. Please contact Support')
        }
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

  .error-text {
    color: #d33c40;
  }

  section {
    margin-bottom: 0;
  }
  .inline-form {
    display:     flex;
    align-items: center;
    gap:         6px;
  }

  .inline-form input {
    width: 15rem;
  }

  .group-create {
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #eee;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }
  table button {
    margin-bottom: 0;
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

  .copy-wrapper {
    position: relative;
    display: inline-flex;
    align-items: center;
  }

  .copied-tooltip {
    position: absolute;
    left: 50%;
    bottom: calc(100% + 4px);
    transform: translateX(-50%);
    background: #333;
    color: #fff;
    font-size: 0.75rem;
    padding: 2px 6px;
    border-radius: 3px;
    white-space: nowrap;
    pointer-events: none;
  }
</style>
