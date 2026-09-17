/**
 * Cypress configuration for pente-fino e2e tests
 */
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    // Base URL - will be set per test or environment
    baseUrl: 'http://localhost:5173',

    // Test runner options
    specPattern: 'cypress/e2e/**/*.{spec,feature}.{ts,tsx,js}',

    // Support file
    supportFile: 'cypress/support/e2e.ts',

    // Default viewport
    viewportWidth: 1280,
    viewportHeight: 720,

    // Request timeout
    defaultCommandTimeout: 4000,
    pageLoadTimeout: 30000,

    // Video recording
    video: false,
    screenshotOnRunFailure: true,

    // Remove unused browsers
    chromeWebSecurity: false,

    // Default environmental variables
    env: {
      // Supabase configuration
      supabaseUrl: '',
      supabaseAnonKey: '',
      // Application base for testing
      appBaseUrl: 'http://localhost:5173',
    },
  },
})