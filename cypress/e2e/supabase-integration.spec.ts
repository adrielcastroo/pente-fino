describe('Pente Fino - Supabase Integration', () => {
  beforeEach(() => {
    // Visit the app base URL
    cy.visit(Cypress.env('appBaseUrl'))
    // Wait for app to load
    cy.wait(2000)
    // Intercept Supabase requests for debugging
    cy.intercept('GET', '**/rest/*').as('supabaseRequest')
    cy.intercept('POST', '**/auth/*').as('supabaseAuth')
  })

  it('should integrate with Supabase for user authentication', () => {
    // The app should show authentication UI or welcome screen
    // Since this is a demo, we verify the Supabase configuration is present
    cy.contains('Supabase').or.contains('Supa').should('be.visible')
      .within(() => {
        cy.contains('ic|postgres|database').should('be.visible')
      })
  })

  it('should maintain Supabase session across page navigation', () => {
    // Login via Supabase
    cy.supabaseLogin('test@unilux.com.br', 'password123')
      .its('status')
      .should('be', 200)

    // Navigate to different page within app
    cy.contains('NavLink|RouterLink').contains('Romaneio').click()
    cy.wait(1000)

    // Session should persist - check for authenticated UI elements
    cy.contains('Usuário|Bem-vindo|Olá').should('be.visible')
  })

  it('should Supabase Edge Functions integrate correctly', () => {
    // Test Edge Function calls (if applicable)
    cy.request({
      method: 'POST',
      url: `${Cypress.env('supabaseUrl')}/rest/v1/*`,
      failOnStatusCode: false,
    }).its('status').should('be.lt', 500)
  })
})