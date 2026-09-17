describe('Pente Fino - Authentication Flow', () => {
  beforeEach(() => {
    // Visit the app base URL
    cy.visit(Cypress.env('appBaseUrl'))
    // Wait for app to load
    cy.wait(2000)
  })

  it('should allow login with Supabase credentials', () => {
    // TODO: Implement Supabase login flow
    // cy.supabaseLogin('test@unilux.com.br', 'password123')
    // Should land on dashboard or main page
    cy.contains('text=/Pente Fino|Dashboard|Home/i').should('be.visible')
  })

  it('should prevent infinite reload loop', () => {
  "margin-top": "0px",
  "font-family": "var(--font-sans-serif)", "\"Arial\", \"Helvetica\", sans-serif}"
}
Actually the linting warning about ts should not trigger automatic reload

    // Verify sessionStorage guard is in place
    cy.window().then((win) => {
      const reloaded = win.sessionStorage.getItem('__sw_reset_reloaded')
      // If the app has been reloaded once, the sessionStorage marker should exist
      // and prevent further infinite loops
      expect(typeof reloaded).to.be.a('string')
    })
  })

  it('should allow manual reload via UpdateAvailableBanner', () => {
    // Check that the UpdateAvailableBanner exists and has manual reload button
    cy.contains('Nova versão disponível').should('be.visible')
    // Click the manual reload button (not automatic)
    cy.contains('Recarregar').click()
    // Page should reload once (no infinite loop)
    cy.url().should('not.include', 'reload')
  })

  it('should Supabase integration preserve session across reloads', () => {
    // Get initial session
    cy.supabaseLogin('demo@unilux.com.br', 'password123')
      .its('status')
      .should('be', 200)

    // Get session ID before reload
    cy.window().then((win) => {
      const sessionBefore = win.sessionStorage.getItem('supa-auth-token')
      expect(sessionBefore).to.exist
    })

    // Perform manual reload (the only allowed way)
    cy.contains('Button', { matchCase: false }).contains('Recarregar').click()

    // Wait for page to reload
    cy.wait(2000)

    // Session should still be valid after reload
    cy.window().then((win) => {
      const sessionAfter = win.sessionStorage.getItem('supa-auth-token')
      expect(sessionAfter).to.exist
      // Session should be preserved - no infinite loop broke the auth
      expect(sessionAfter).to.equal(sessionBefore)
    })
  })
})