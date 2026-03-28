const API      = 'http://localhost:3000'
const USER     = 'test@example.com'
const ITEM_ID  = '507f1f77bcf86cd799439011'

const seedItem = {
  _id:               ITEM_ID,
  user_name:         USER,
  item_name:         'Test Item',
  model:             'Model X',
  price:             '99.99',
  store:             'Amazon',
  gifter_user_name:  '',
  gifted_date:       null,
}

beforeEach(() => {
  cy.intercept('GET', `${API}/WishList/${USER}`, [seedItem]).as('getWishList')
  cy.mockAuth(USER)
  cy.visit('/my-wish-list')
  cy.wait('@getWishList')
})

describe('My Wish List - add item', () => {
  it('calls POST /WishList/Create (exact case)', () => {
    const newItem = { ...seedItem, _id: '507f1f77bcf86cd799439012', item_name: 'New Item' }
    cy.intercept('POST', `${API}/WishList/Create`, newItem).as('createItem')

    cy.get('#wish-item-form input').first().type('New Item')
    cy.contains('button', 'Add Item').click()

    cy.wait('@createItem')
  })
})

describe('My Wish List - edit item', () => {
  it('calls POST /WishList/Update (exact case)', () => {
    cy.intercept('POST', `${API}/WishList/Update`, { ...seedItem, item_name: 'Edited Item' }).as('updateItem')

    cy.get('.fa-edit').click({ force: true })
    cy.get('#wish-list-table input').first().clear().type('Edited Item')
    cy.get('.fa-save').click({ force: true })

    cy.wait('@updateItem')
  })
})

describe('My Wish List - delete item', () => {
  it('calls POST /WishList/Delete/:id (exact case)', () => {
    cy.intercept('POST', `${API}/WishList/Delete/${ITEM_ID}`, seedItem).as('deleteItem')

    cy.on('window:confirm', () => true)
    cy.get('.fa-trash-alt').click({ force: true })

    cy.wait('@deleteItem')
  })
})
