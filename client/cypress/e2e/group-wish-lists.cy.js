import { API, TEST_USER as CURRENT_USER } from '../support/commands'
const OTHER_USER = 'other@example.com'
const ITEM_ID    = '507f1f77bcf86cd799439011'
const GROUP_ID   = '507f1f77bcf86cd799439022'

const otherItem = {
  _id:               ITEM_ID,
  user_name:         OTHER_USER,
  item_name:         'Their Item',
  model:             '',
  price:             20.00,
  store:             'eBay',
  gifter_user_name:  '',
  gifted_date:       null,
}

const myGroup = {
  _id:        GROUP_ID,
  name:       'Public',
  inviteCode: 'PUBLIC',
  members:    [CURRENT_USER, OTHER_USER],
}

beforeEach(() => {
  cy.intercept('GET', `${API}/Groups`,                                    [myGroup]).as('getGroups')
  cy.intercept('GET', `${API}/WishList?groupId=${GROUP_ID}`, [otherItem]).as('getWishList')
  cy.mockAuth(CURRENT_USER)
  cy.visit('/group-wish-lists')
  cy.wait('@getGroups')
  cy.wait('@getWishList')
})

describe('Group Wish Lists - gift item', () => {
  it('calls PUT /WishList/:id', () => {
    cy.intercept('PUT', `${API}/WishList/${ITEM_ID}`, {
      ...otherItem,
      gifter_user_name: CURRENT_USER,
    }).as('giftItem')

    cy.on('window:confirm', () => true)
    cy.get('.fa-gift').click({ force: true })

    cy.wait('@giftItem')
  })
})
