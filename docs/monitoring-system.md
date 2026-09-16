# Monitoring System Documentation

## Overview

This document defines the monitoring and observability system for the Pente Fino application, covering error tracking, performance monitoring, analytics, and system health checks. The system provides comprehensive visibility into application behavior, errors, and performance while maintaining user privacy and data security.

## Monitoring Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MONITORING LAYERS                               │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │  Frontend   │ │  Backend    │ │  External   │ │  Storage    │   │
│  │  Monitoring │ │  Monitoring │ │  Services   │ │  & Databases│   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
│        │                │                │                │        │
└────────┴────────────────┴────────────────┴────────────────┴────────┘
         │                                │                                │
┌─────────────────────────────────────────────────────────────────────┐
│                    UNIFIED MONITORING INTERFACE                     │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                   │
│  │  Sentry     │ │  PostHog    │ │  Custom     │                   │
│  │  Errors     │ │  Analytics  │ │  Metrics    │                   │
│  │  & Perf     │ │  & Behavior │ │  & Logs     │                   │
│  └─────────────┘ └─────────────┘ └─────────────┘                   │
└─────────────────────────────────────────────────────────────────────┘
```

## Frontend Monitoring Stack

### 1. Sentry Error Tracking

**Purpose**: Capture runtime errors, exceptions, and performance issues with full context.

**Implementation**:
- SDK: `@sentry/react@10.74.0`
- Initialization: `src/main.tsx`
- Features:
  - Error capture with stack traces
  - Performance monitoring (transaction tracing)
  - Session replay (optional)
  - Breadcrumbs for navigation context
  - User context (anonymous ID, email if authenticated)
  - Release tracking (version from `__APP_VERSION__`)
  - Environment tracking (development/production)

**Configuration**:
```typescript
// src/main.tsx (excerpt)
import * as Sentry from '@sentry/react';

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true, // GDPR compliance
      }),
    ],
    tracesSampleRate: 1.0, // Capture 100% of transactions for performance
    replaysOnErrorSampleRate: 1.0, // Record replays for errors
    replaysSessionSampleRate: 0.1, // Record 10% of sessions
    enableLogs: true,
    debug: import.meta.env.DEV,
    release: import.meta.env.VITE_APP_VERSION || 'unknown',
    environment: import.meta.env.MODE, // development/production
  });
}
```

**Error Capture**:
```typescript
// Automatic: Uncaught exceptions and promise rejections
// Manual: Sentry.captureException(error, { extra: context })
// Messages: Sentry.captureMessage(message, { level: 'warning' })
```

### 2. PostHog Analytics

**Purpose**: Track user behavior, feature usage, and product analytics.

**Implementation**:
- SDK: `posthog-js` (latest)
- Initialization: `src/main.tsx`
- Features:
  - Autocapture of events (clicks, form submissions, page views)
  - Custom event tracking
  - Funnel analysis
  - Retention metrics
  - Session recording (optional, GDPR-compliant)
  - Feature flags
  - A/B testing framework

**Configuration**:
```typescript
// src/main.tsx (excerpt)
import posthog from 'posthog-js';

if (import.meta.env.VITE_POSTHOG_KEY) {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://us.posthog.com',
    autocapture: true,
    capture_pageview: true,
    capture_pageleave: true,
    persistence: 'localStorage',
    loaded: (ph) => {
      if (import.meta.env.DEV) {
        console.log('[PostHog] Initialized', ph.config.api_host);
      }
    },
  });
}
```

**Event Tracking**:
```typescript
// Automatic events from autocapture
// Custom events
posthog.capture('feature_used', {
  feature: 'auge_sync',
  action: 'pedidos_sync',
  success: true,
  entity_count: 150
});

// Identify user (when authenticated)
posthog.identify(userId, {
  email: user.email,
  role: user.role,
  created_at: user.createdAt
});

// Set user properties
posthog.person.set({
  '$email': user.email,
  '$role': user.role,
  '$created_at': user.createdAt
});
```

### 3. Custom Performance Monitoring

**Purpose**: Monitor application performance metrics not covered by Sentry.

**Implementation**:
- Performance API: `window.performance`
- Custom metrics for key interactions
- Long task detection
- Memory monitoring (where available)

**Key Metrics**:
- Page load times (navigation timing)
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- First Input Delay (FID)
- Cumulative Layout Shift (CLS)
- Interaction to Next Paint (INP)
- Custom timings for critical user flows

**Implementation Example**:
```typescript
// src/lib/performance-monitor.ts
export class PerformanceMonitor {
  static init() {
    if (!('performance' in window)) return;
    
    // Observe long tasks
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Long task threshold
            // Report to monitoring system
            console.warn('Long task detected:', entry.name, entry.duration);
          }
        }
      });
      
      observer.observe({ entryTypes: ['longtask'] });
    }
    
    // Measure custom timings
    this.measureTiming('app_ready');
  }
  
  static measureTiming(name: string) {
    if ('performance' in window && 'mark' in window.performance) {
      performance.mark(`${name}-start`);
      // ... do work ...
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
      
      // Optionally send to monitoring
      const measure = performance.getEntriesByName(name, 'measure').pop();
      if (measure) {
        // Send to analytics or logging
        console.info('Performance metric:', measure.name, measure.duration);
      }
    }
  }
}
```

## Backend Monitoring Functions

### 1. Sentry Issues Proxy

**File**: `supabase/functions/sentry-issues/index.ts`

**Purpose**: Secure proxy to Sentry API for issue management in the admin interface.

**Features**:
- Environment variable validation (`SENTRY_AUTH_TOKEN`, `SENTRY_ORG_SLUG`)
- Role-based access control (admin only)
- CORS headers for browser access
- Error handling and fallback responses
- Query parameter support for filtering
- Project selection capabilities

**Endpoints**:
- `GET /sentry-issues?action=issues&query=is:unresolved&period=24h`
- `GET /sentry-issues?action=projects` (list projects)
- `GET /sentry-issues?action=stats` (project statistics)

### 2. PostHog Analytics Proxy

**File**: `supabase/functions/posthog-analytics/index.ts`

**Purpose**: Secure proxy to PostHog API for analytics in the admin interface.

**Features**:
- Environment variable validation (`POSTHOG_API_KEY`, `POSTHOG_PROJECT_ID`)
- Role-based access control (admin only)
- CORS headers for browser access
- Error handling with detailed error messages
- Support for all PostHog API endpoints used in admin
- Rate limiting awareness

**Endpoints**:
- `GET /posthog-analytics?action=events&period=-24h&limit=50`
- `GET /posthog-analytics?action=insights`
- `GET /posthog-analytics?action=event_definitions`
- `GET /posthog-analytics?action=trend&event=$pageview&period=-7d`

### 3. Auge Sync Health Check

**File**: `supabase/functions/auge-sync/index.ts`

**Purpose**: Health check and system status endpoint.

**Features**:
- Ping functionality (`action=ping`)
- System status reporting
- Integration health checks
- Error logging to audit tables
- Performance metrics reporting

**Endpoints**:
- `GET /auge-sync?action=ping` - Returns `{ ok: true, latency_ms: N }`
- `GET /auge-sync?action=status` - Detailed system status
- `POST /auge-sync?action=sync_pedidos` - Trigger pedidos sync

## Storage and Databases

### 1. Supabase Tables for Monitoring

#### audit_logs Table
**Purpose**: Immutable audit trail for critical data changes.

**Schema**:
- `id`: UUID (primary key)
- `user_id`: UUID (foreign key to auth.users)
- `user_email`: Text (email of user who made change)
- `action`: Text (INSERT, UPDATE, DELETE)
- `entity`: Text (table name affected)
- `record_id`: UUID (ID of affected record)
- `changes`: JSONB (changed fields and values)
- `changed_keys`: Text[] (list of changed field names)
- `created_at`: TimestampUTC (when change occurred)
- `ip_address`: Text (client IP address)
- `user_agent`: Text (browser user agent)

**Triggers**: Automatically populated by database triggers on monitored tables.

#### auth_audit_logs Table
**Purpose**: Authentication event logging.

**Schema**:
- `id`: UUID (primary key)
- `event_type`: Text (login_attempt, password_reset, etc.)
- `email`: Text (email attempted)
- `ip_address`: Text (client IP)
- `user_agent`: Text (browser user agent)
- `status`: Text (success, failed)
- `failure_reason`: Text (if failed)
- `created_at`: TimestampUTC
- `metadata`: JSONB (additional context)

#### feature_flags Table
**Purpose**: Feature flag management for gradual rollouts.

**Schema**:
- `id`: UUID (primary key)
- `key`: Text (unique flag identifier)
- `enabled`: Boolean (flag state)
- `description`: Text (flag description)
- `rollout_roles`: Text[] (roles to which flag is rolled out)
- `created_at`: TimestampUTC
- `updated_at`: TimestampUTC

#### app_releases Table
**Purpose**: Application release tracking and version management.

**Schema**:
- `id`: UUID (primary key)
- `version`: Text (semantic version string)
- `notes`: Text (release notes)
- `released_by`: UUID (foreign key to auth.users)
- `released_at`: TimestampUTC
- `is_stable`: Boolean (marked as stable release)
- `is_current`: Boolean (currently deployed version)
- `build_time`: TimestampUTC (when build was created)
- `metadata`: JSONB (build metadata, commit hash, etc.)

### 2. Error Logging Strategy

**Frontend to Backend Error Reporting**:
1. Errors captured by Sentry SDK
2. Critical errors reported to backend via Edge Functions
3. Errors logged to `audit_logs` or custom error tables
4. Admin interface displays errors via monitoring tabs

**Backend Error Handling**:
1. Edge Functions catch all errors
2. Errors logged to console (visible in Supabase logs)
3. Critical errors reported to Sentry via backend SDK (optional)
4. User-friendly error messages returned to frontend
5. Fallback responses prevent function crashes

## Monitoring UI Components

### 1. IntegrationsTab

**Purpose**: Manage third-party service integrations.

**Features**:
- Toggle switches for enabling/disabling integrations
- Status indicators (active, disabled, error, coming soon)
- Last check timestamps and error messages
- Configuration forms for integrations requiring setup
- Kill switch for global disable of all integrations

**Integrations Monitored**:
- Sentry (error tracking)
- PostHog (analytics)
- n8n (workflow automation)
- Auge ERP (ERP integration)
- External databases
- Email services
- Fiscal services (NF-e imports)
- Logistics services (tracking)

### 2. ObservabilityTab

**Purpose**: System health and performance dashboard.

**Features**:
- AI usage metrics (24h and 7d)
- System operation counts (deletes, auth failures)
- Entity change tracking (top modified entities)
- External tool links (Sentry, PostHog)
- Real-time updates with manual refresh
- Performance indicators

**Metrics Displayed**:
- AI chat calls (24h/7d)
- Delete operations (24h)
- Failed login attempts (24h)
- Top 8 most-changed entities (24h)
- System uptime and health status

### 3. SentryTab

**Purpose**: Sentry error monitoring and management.

**Features**:
- Project selection dropdown
- Time period selector (1h, 24h, 7d, 30d)
- Issue query input (Sentry query syntax)
- Severity distribution (fatal, error, warning, info, debug)
- Issue list with pagination
- Issue details (culprit, first/last seen, user count)
- Direct links to Sentry issues
- Refresh functionality

**Issue Fields Displayed**:
- ID and short ID
- Title and culprit (where error occurred)
- Severity level (with color coding)
- Status (resolved/unresolved)
- Event count and user count
- First seen and last seen timestamps
- Permalink to Sentry issue

### 4. PostHogTab

**Purpose**: PostHog analytics and user behavior dashboard.

**Features**:
- Event filtering (specific events or all)
- Time period selector (-1h, -6h, -24h, -7d, -30d)
- KPI cards (events in period, distinct events, saved insights)
- Trend charts (event volume over time)
- Event definitions list (with volume metrics)
- Saved insights display (with links to PostHog)
- Recent events table (timestamp, event, distinct ID, route)

**Analytics Displayed**:
- Event volume trends
- Distinct event counts
- Saved insights with direct links
- Recent events with contextual information
- Event definition usage statistics

## Implementation Guidelines

### 1. Error Handling Strategy

**Frontend Errors**:
- Uncaught exceptions → Sentry SDK → Sentry backend
- Promise rejections → Sentry SDK → Sentry backend
- Manual errors → `Sentry.captureException(error, { extra: context })`
- User-facing errors → Display via UI with optional retry
- Validation errors → Show inline, don't report to Sentry (unless systemic)

**Backend Errors**:
- Edge Functions → Try/catch all operations
- Log errors to console (Supabase logs)
- Return user-friendly error messages
- Never expose sensitive information in error messages
- Provide actionable error messages when possible
- Use HTTP status codes appropriately (400, 401, 403, 404, 500)

**Database Errors**:
- Constraints violations → Return meaningful messages
- Connection errors → Log and return service unavailable
- Query errors → Log and return bad request when appropriate
- Timeout errors → Log and suggest retry

### 2. Privacy and Data Protection

**Sentry**:
- Never send personally identifiable information (PII) unless necessary
- Use `beforeSend` callback to scrub sensitive data
- Mask IP addresses if not required for geolocation
- Avoid capturing form inputs containing passwords or sensitive data
- Enable replay masking for all text and media

**PostHog**:
- Do not track sensitive form fields
- Mask IP addresses if not required for geolocation
- Do not track payment information or credentials
- Use person identification only when necessary and with consent
- Respect do-not-track (DNT) browser settings
- Provide opt-out mechanisms where required by law

**Custom Monitoring**:
- Never log passwords, tokens, or sensitive credentials
- Hash or anonymize user identifiers when storing logs
- Retain logs only as long as necessary for business/legal requirements
- Encrypt sensitive logs at rest
- Implement proper access controls for log viewing

### 3. Performance Considerations

**Frontend**:
- Lazy load heavy monitoring SDKs
- Sample performance data in high-traffic scenarios
- Use efficient data structures for metric aggregation
- Debounce frequent events (resize, scroll, mousemove)
- Use requestAnimationFrame for visual updates
- Minimize DOM updates during performance measurements

**Backend**:
- Cache frequently accessed data
- Use database indexes for query performance
- Implement connection pooling
- Use asynchronous operations where possible
- Monitor function execution times and optimize slow queries
- Implement circuit breakers for external service calls

### 4. Alerting and Notification

**Critical Errors**:
- Immediate notification to development team (Slack/email)
- PagerDuty integration for severe production incidents
- Automated issue creation in project management tools
- Status page updates for service-impacting incidents

**Warnings**:
- Daily digest of non-critical issues
- Weekly performance reports
- Monthly usage and analytics reports
- Trend analysis for recurring issues

**User-Facing**:
- In-app notifications for recoverable errors
- Actionable error messages with suggested solutions
- Status banners for system-wide issues
- Maintenance windows communicated in advance

## Implementation Checklist

### Phase 1: Core Monitoring (Week 1)
- [ ] Verify Sentry SDK initialization in `src/main.tsx`
- [ ] Verify PostHog SDK initialization in `src/main.tsx`
- [ ] Test error capture with intentional errors
- [ ] Test custom event tracking
- [ ] Verify environment variables are loaded correctly

### Phase 2: Backend Functions (Week 2)
- [ ] Test `sentry-issues` edge function
- [ ] Test `posthog-analytics` edge function
- [ ] Verify authentication and authorization
- [ ] Test error handling and fallback responses
- [ ] Validate CORS headers

### Phase 3: UI Components (Week 3)
- [ ] Verify IntegrationsTab displays integration status
- [ ] Test toggle switches for integrations
- [ ] Verify ObservabilityTab shows system metrics
- [ ] Test SentryTab issue listing and filtering
- [ ] Test PostHogTab analytics display

### Phase 4: Integration Testing (Week 4)
- [ ] End-to-end error tracking (frontend → Sentry → admin)
- [ ] End-to-end analytics tracking (frontend → PostHog → admin)
- [ ] Performance monitoring validation
- [ ] Privacy and data protection verification
- [ ] Load testing and performance optimization

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-09-16 | Initial monitoring system documentation |

## References

- [Sentry Documentation](https://docs.sentry.io/platforms/javascript/guides/react/)
- [PostHog Documentation](https://posthog.com/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance_API)
- [Web Vitals](https://web.dev/vitals/)
- [GDPR and Data Protection Guidelines](https://gdpr.eu/)

---
*This document is the single source of truth for the Pente Fino monitoring system. All monitoring and observability implementations must adhere to these specifications.*