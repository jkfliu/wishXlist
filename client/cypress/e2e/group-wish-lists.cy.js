const API          = 'http://localhost:3000'
const CURRENT_USER = 'test@example.com'
const OTHER_USER   = 'other@example.com'
const ITEM_ID      = '507f1f77bcf86cd799439011'

const otherItem = {
  _id:               ITEM_ID,
  user_name:         OTHER_USER,
  item_name:         'Their Item',
  model:             '',
  price:             '20.00',
  store:             'eBay',
  gifter_user_name:  '',
  gifted_date:       null,
}

beforeEach(() => {
  cy.intercept('GET', `${API}/WishList/`, [otherItem]).as('getWishList')
  cy.mockAuth(CURRENT_USER)
  cy.visit('/group-wish-lists')
  cy.wait('@getWishList')
})

describe('Group Wish Lists - gift item', () => {
  it('calls POST /WishList/Update (exact case)', () => {
    cy.intercept('POST', `${API}/WishList/Update`, {
      ...otherItem,
      gifter_user_name: CURRENT_USER,
    }).as('giftItem')

    cy.on('window:confirm', () => true)
    cy.get('.fa-gift').click({ force: true })

    cy.wait('@giftItem')
  })
})
