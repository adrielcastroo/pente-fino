/**
 * Cypress E2E support commands for pente-fino
 */

// Import commands cypress/additions.js
/// <reference cypress="support" />

// Example custom command for Supabase login
 Cypress.Commands.add('supabaseLogin', (email, password) => {
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('supabaseUrl')}/auth/v1/signin',
    body: { email, password },
    failOnStatusCode: false,
  })
})

// Example custom command for Supabase signup
 Cypress.Commands.add('supabaseSignup', (email, password) => {
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('supabaseUrl')}/auth/v1/signup`,
    body: { email, password },
    failOnStatusCode: false,
  })
})

// Example custom command to check if infinite reload is prevented
 Cypress.Commands.add('shouldNotReloadInfinite', () => {
  // Verify that sessionStorage prevents reload loop
  cy.window().then((win) => {
    const hasSessionStorage = win.sessionStorage.getItem('__sw_reset_reloaded')
    // If the key exists, the reload was already prevented
    expect(hasSessionStorage).to.exist
  })
})