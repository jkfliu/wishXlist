const TEST_USER = 'test@example.com'
const TEST_DISPLAY_NAME = 'Test User'
const API = 'http://localhost:3000'

Cypress.Commands.add('mockAuth', (user = TEST_USER) => {
  cy.intercept('GET', '/Auth/Me', {
    username:    user,
    displayName: TEST_DISPLAY_NAME,
  }).as('authMe')

  cy.visit('/', {
    onBeforeLoad(win) {
      win.localStorage.setItem('vuex_globalUser',      user)
      win.localStorage.setItem('vuex_isAuthenticated', 'true')
    },
  })
})

export { TEST_USER, API }
