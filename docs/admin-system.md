# Admin System Documentation

## Overview

This document defines the admin system architecture for the Pente Fino application, covering the admin interface, navigation, role-based access control, feature flags, release management, and system administration capabilities. The admin system provides secure, centralized control over application configuration, integrations, monitoring, and operational functions.

## Admin System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ADMIN LAYER                                     │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                   │
│  │  Layout &   │ │  Navigation │ │  Access     │                   │
│  │  Theming    │ │  System     │ │  Control    │                   │
│  └─────────────┘ └─────────────┘ └─────────────┘                   │
│        │                │                │                        │
└────────┴────────────────┴────────────────┴────────────────┘        │
         │                                │                                │
┌─────────────────────────────────────────────────────────────────────┐
│                    CORE ADMIN FUNCTIONALITY                         │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │  Integrations│ │  Monitoring │ │  Releases   │ │  Settings   │   │
│  │  Management  │ │  & Observ.  │ │  Management │ │  Management │   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
│        │                │                │                │        │
└────────┴────────────────┴────────────────┴────────────────┴────────┘
         │                                │                                │
┌─────────────────────────────────────────────────────────────────────┐
│                    SPECIALIZED MODULES                             │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │  Auge ERP   │ │  Database   │ │  Audit      │ │  Backup     │   │
│  │  Management │ │  Monitoring │ │  & Logging  │ │  & Recovery │   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Admin Layout

**File**: `src/components/admin/AdminLayout.tsx`

**Purpose**: Main admin interface structure with sidebar navigation, header, and tab system.

**Features**:
- **Header**: Application title, version badge, user info, logout button
- **Sidebar**: Collapsible navigation with icon labels and sections
- **Tab System**: URL query parameter-driven tab selection (`?tab=section`)
- **Responsive Design**: Mobile-friendly collapsible sidebar
- **Route Protection**: Integrated with authentication system
- **Sub-route Support**: Dedicated paths like `/admin/n8n` for complex pages

**Sections**:
1. **Visão** (Vision): Overview dashboard
2. **Conexões** (Connections): Integrations, Auge ERP, n8n, backfill transfers
3. **Observabilidade** (Observability): System monitoring, Sentry, PostHog, LLM tokens
4. **Entrega** (Delivery): Feature flags, releases
5. **Governança** (Governance): Users & access, Auge permissions, database, backup, security
6. **Auditoria** (Audit): Application audit, Auge audit, technical audit

### 2. Authentication and Authorization

**File**: `src/hooks/use-auth.tsx`

**Purpose**: Central authentication context with role-based access control.

**Features**:
- **User Management**: Login, logout, guest mode, profile loading
- **Role Hierarchy**: admin > gerente > supervisor > operador
- **Permission Checking**: `can(action: Action)` hook for UI-level permissions
- **Module Access**: Users can be granted access to specific modules (estoque, expedição, compras)
- **Session Handling**: Automatic token refresh, session persistence
- **Security**: Protection against common vulnerabilities (XSS, CSRF)

**Role-Based Access Control (RBAC)**:
- Admin: Full access to all functions and modules
- Gerente: Access to most functions, limited admin functions
- Supervisor: Access to operational and monitoring functions
- Operador: Basic operational functions only

**Permission Examples**:
- `manage:users` → admin only
- `manage:system` → admin only
- `view:dashboard-executivo` → gerente+
- `export:relatorio` → gerente+
- `delete:registro` → supervisor+
- `edit:registro-antigo` → supervisor+

### 3. Feature Flags System

**Purpose**: Gradual feature rollouts and targeted releases.

**Components**:
- **Database Table**: `feature_flags` (id, key, enabled, description, rollout_roles, timestamps)
- **Hook**: `src/hooks/useFeatureFlag.ts` - React hook for checking flag status
- **Component**: `FeatureFlagToggle` - Toggle switch with role-based targeting
- **Admin Page**: `FeatureFlagsPage` - CRUD interface for managing flags

**Features**:
- **Role-Based Rollouts**: Flags can be enabled for specific user roles
- **Description Fields**: Clear documentation of flag purpose
- **Timestamps**: Creation and update tracking
- **Admin Interface**: Intuitive interface for managing flags
- **Fallback Safety**: Flags default to disabled for safety

**Usage**:
```typescript
// In components
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

const MyComponent = () => {
  const isEnabled = useFeatureFlag('new_feature');
  
  return isEnabled ? <NewFeature /> : <OldFeature />;
};

// With role targeting
const isEnabled = useFeatureFlag('beta_feature', ['admin', 'gerente']);
```

### 4. Release Management

**Purpose**: Track application releases, versions, and deployment history.

**Components**:
- **Database Table**: `app_releases` (id, version, notes, released_by, released_at, is_stable, is_current, build_time, metadata)
- **RPC Function**: `register_app_release` - Idempotent release registration
- **Hook**: `src/hooks/useAppReleases.ts` - Fetch releases, detect current version
- **Component**: `ReleaseRegistrar` - Auto-registers builds on authenticated access
- **Admin Page**: `ReleasesPage` - Full CRUD for releases with version bumping

**Features**:
- **Semantic Versioning**: Follows SemVer (MAJOR.MINOR.PATCH)
- **Release Notes**: Detailed documentation of changes
- **Stability Marking**: Mark releases as stable/production-ready
- **Current Version Tracking**: Identifies currently deployed version
- **Build Time Tracking**: When the build was created
- **Metadata Storage**: Commit hash, CI/CD pipeline info, etc.
- **Idempotent Registration**: Prevents duplicate entries
- **Automatic Registration**: ReleaseRegistrar component on app load
- **Manual Management**: ReleasesPage for manual release creation

**Version Bumping**:
- Patch: Bug fixes and small improvements
- Minor: New features, backward compatible
- Major: Breaking changes, major redesigns

### 5. Integrations Management

**Purpose**: Manage third-party service integrations and external connections.

**Components**:
- **Database Table**: `integrations` (id, key, name, category, enabled, status, config, timestamps, notes)
- **Component**: `IntegrationsTab` - Main integration management interface
- **Hook**: Not typically used (direct Supabase queries in component)
- **External Functions**: Secure proxies for integration APIs (sentry-issues, posthog-analytics, etc.)

**Features**:
- **Category Grouping**: Organize integrations by function (IA, Fiscal, Logística, etc.)
- **Toggle Switches**: Enable/disable integrations with visual feedback
- **Status Indicators**: Active, disabled, error, coming soon, unknown
- **Last Check Timestamps**: When integration status was last verified
- **Error Messages**: Display last error for troubleshooting
- **Configuration Forms**: For integrations requiring setup (coming soon)
- **Global Kill Switch**: Disable all integrations immediately for emergency situations
- **Role-Based Access**: Admin-only access to integration management

**Integration Categories**:
- **IA**: AI vision services
- **Fiscal**: NF-e import, SEFAZ services
- **Logística**: Tracking, delivery services
- **Automação**: Workflow automation (n8n)
- **Comunicação**: Email, messaging services
- **ERP**: SAP B1, external databases, Auge ERP
- **Infraestrutura**: Infrastructure services
- **Observabilidade**: Monitoring (Sentry, PostHog), LLM tokens

### 6. Monitoring and Observability

**Purpose**: Monitor system health, performance, and external service status.

**Components**:
- **ObservabilityTab**: System metrics dashboard
- **SentryTab**: Error tracking and management
- **PostHogTab**: Analytics and user behavior dashboard
- **LlmTokensTab**: AI provider status and usage monitoring
- **ExternalToolCard**: Reusable component for linking to external services

**ObservabilityTab Features**:
- AI usage metrics (24h and 7d)
- System operation counts (delete operations, failed auth attempts)
- Entity change tracking (top modified entities in last 24h)
- External tool links with direct access to monitoring tabs
- Real-time updates with manual refresh button
- Performance indicators and health status

**SentryTab Features**:
- Project selection (for multi-project Sentry setups)
- Time period selector (1h, 24h, 7d, 30d)
- Issue query input (Sentry query syntax)
- Severity distribution visualization
- Issue list with sorting and pagination
- Detailed issue information (culprit, first/last seen, user count)
- Direct links to Sentry issues
- Refresh functionality

**PostHogTab Features**:
- Event filtering (specific events or all events)
- Time period selector (-1h, -6h, -24h, -7d, -30d)
- KPI cards (events in period, distinct events, saved insights)
- Trend charts (event volume over time)
- Event definitions list with volume metrics
- Saved insights display with direct links to PostHog
- Recent events table (timestamp, event, distinct ID, route)

**LlmTokensTab Features**:
- Provider health monitoring (HTTP status, latency)
- Active provider selection
- Model picking for reasoning and fast models
- Usage quotas and rate limit monitoring
- Token consumption tracking
- Error rate and success rate monitoring

### 7. Specialized Admin Modules

#### Auge ERP Management
**Files**: 
- `src/components/admin/AugeSyncStatusPage.tsx` - Sync status and controls
- `src/components/auge/AugeAdminPanel.tsx` - Detailed Auge ERP administration
- `src/components/auge/AugeKardexTab.ktx` - Auge kardex (inventory) management
- `src/components/auge/AugePermissoesTab.tsx` - Auge user permissions management

**Features**:
- Sync status monitoring (last sync, next scheduled sync)
- Manual sync triggers for different entities
- Configuration management for Auge connection
- Error logging and troubleshooting tools
- Permission management for Auge users
- Inventory synchronization controls
- Financial data synchronization controls

#### Database Management
**Files**:
- `src/components/admin/DepositosAdminPage.tsx` - Deposit administration
- `src/components/admin/BackupTab.tsx` - Database backup and export
- `src/components/admin/DatabaseTab.tsx` - Real-time database monitoring

**Features**:
- Real-time table monitoring (row counts, growth trends)
- Backup creation and management
- Export capabilities (CSV, JSON, Excel)
- Database health checks
- Connection status monitoring
- Query performance monitoring (where applicable)
- Data integrity verification

#### Audit and Logging
**Files**:
- `src/components/admin/AuditTab.tsx` - Application audit logs
- `src/components/admin/SecurityTab.tsx` - Security and authentication logs
- `src/components/admin/TechnicalAuditTab.tsx` - Technical audit reports
- `src/components/admin/AugePermissoesTab.tsx` - Auge-specific audit logs

**Features**:
- Immutable audit trails for critical operations
- Authentication event logging (login attempts, password resets)
- Security event monitoring (failed logins, suspicious activity)
- Technical audit reports (system health, performance bottlenecks)
- Configurable retention policies
- Export capabilities for audit logs
- Search and filtering capabilities
- User-friendly presentation of complex audit data

## Implementation Guidelines

### 1. Admin Layout Structure

When creating new admin pages or modifying existing ones:

1. **Use AdminLayout**: Wrap content in `<AdminLayout>` for consistent header, sidebar, and theming
2. **Follow Navigation Structure**: Place new sections in appropriate nav section (Visão, Conexões, etc.)
3. **Use Tab System**: For internal admin pages, use the tab system (`?tab=section`)
4. **Consider Sub-routes**: For complex pages, consider dedicated paths like `/admin/new-feature`
5. **Apply Access Control**: Use `<RequireRole role="admin">` or similar for protection
6. **Include Header Actions**: Add relevant actions to the admin header (version, user info, etc.)
7. **Follow Responsiveness**: Ensure sidebar collapses properly on mobile
8. **Maintain Consistency**: Use existing patterns for headers, footers, and content sections

### 2. Component Usage

**Preferred Components**:
- Use `src/components/ui/` components (shadcn/ui based) for foundational elements
- Use `src/components/design-system/` for custom admin-specific components
- Use `src/components/admin/` for admin-specific components and layouts
- Avoid duplicating functionality - reuse existing components when possible

**Component Examples**:
- Buttons: Use `Button` from `src/components/ui/button.tsx`
- Cards: Use `Card` compositional pattern from `src/components/ui/card.tsx`
- Inputs: Use `Input` from `src/components/ui/input.tsx`
- Badges: Use `Badge` from `src/components/ui/badge.tsx`
- Modals: Use `Modal` from `src/components/ui/modal.tsx`
- Tabs: Use `Tabs` from `src/components/ui/tabs.tsx`
- Separators: Use `Separator` from `src/components/ui/separator.tsx`
- Skeletons: Use `Skeleton` from `src/components/ui/skeleton.tsx`

### 3. Data Fetching Patterns

**Preferred Methods**:
1. **React Query**: For most data fetching (queries and mutations)
2. **Direct Supabase**: For simple operations or when React Query isn't suitable
3. **Custom Hooks**: For complex data fetching logic shared across components
4. **Edge Functions**: For secure access to external APIs or complex server-side logic

**React Query Example**:
```typescript
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const useAdminData = () => {
  return useQuery({
    queryKey: ['admin-data'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_table')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    // Stale time: 5 minutes for admin data that doesn't change frequently
    staleTime: 5 * 60 * 1000,
    // Cache time: 30 minutes
    gcTime: 30 * 60 * 1000,
  });
};
```

**Direct Supabase Example**:
```typescript
// For simple operations or mutations
const handleAction = async () => {
  try {
    const { data, error } = await supabase
      .from('table')
      .insert({ /* data */ })
      .select();
    
    if (error) throw error;
    // Handle success
  } catch (error) {
    // Handle error (show toast, log, etc.)
  }
};
```

### 4. Error Handling and Loading States

**Loading States**:
- Use `Skeleton` components for loading placeholders
- Show loading indicators for buttons and inputs when appropriate
- Disable interactive elements during loading
- Provide clear visual feedback for loading status

**Error Handling**:
- Display user-friendly error messages
- Use toast notifications for non-blocking errors
- Show error boundaries for catastrophic failures
- Log errors appropriately (frontend to Sentry, backend to logs)
- Provide retry mechanisms for recoverable errors
- Never expose sensitive information in error messages

### 5. Accessibility and Internationalization

**Accessibility Requirements**:
- WCAG 2.1 AA compliance
- Proper color contrast (minimum 4.5:1 for normal text)
- Keyboard navigable interface
- ARIA labels and roles where appropriate
- Focus visible indicators
- Responsive to user preferences (reduced motion, etc.)
- Semantic HTML structure
- Proper heading hierarchy (h1-h6)

**Internationalization**:
- While the application is primarily in Portuguese-BR, structure code for future i18n
- Avoid hardcoded strings in components
- Use consistent formatting for numbers, dates, currencies
- Consider right-to-left (RTL) language support in future
- Use ISO date formats for storage, localize for display

### 6. Performance Considerations

**Optimization Techniques**:
- **Lazy Loading**: Load admin tabs and components on-demand
- **Code Splitting**: Route-based chunking for admin sections
- **Caching**: Appropriate stale times for React Query queries
- **Debouncing**: For frequent updates (resize, scroll, input)
- **Virtualization**: For large lists and tables (consider react-window)
- **Image Optimization**: Proper sizing, compression, and lazy loading
- **Bundle Analysis**: Regularly check bundle size and optimize dependencies
- **Server-Side Processing**: Move heavy computations to backend when possible

**Monitoring**:
- Use browser dev tools to identify performance bottlenecks
- Monitor memory usage and prevent leaks
- Track frame rates for animations and transitions
- Measure time to interactive (TTI) and first contentful paint (FCP)
- Optimize critical rendering path

## Implementation Checklist

### Phase 1: Foundation (Week 1-2)
- [ ] Create admin system documentation
- [ ] Refactor AdminLayout for consistency
- [ ] Standardize navigation structure and sections
- [ ] Implement role-based access control improvements
- [ ] Create/update auth hooks if needed
- [ ] Establish component usage guidelines

### Phase 2: Core Functionality (Week 3-4)
- [ ] Refactor IntegrationsTab for consistency
- [ ] Update ObservabilityTab with improved metrics
- [ ] Standardize SentryTab and PostHogTab interfaces
- [ ] Implement ReleaseRegistrar improvements
- [ ] Standardize FeatureFlagsPage interface
- [ ] Update all admin pages to follow consistent patterns

### Phase 3: Specialized Modules (Week 5-6)
- [ ] Ref Auge ERP management components
- [ ] Update database monitoring and backup components
- [ ] Refine audit and logging components
- [ ] Standardize specialized module interfaces
- [ ] Ensure consistent error handling across modules

### Phase 4: Integration and Testing (Week 7-8)
- [ ] Test role-based access control across all sections
- [ ] Verify integration toggling works correctly
- [ ] Test release management and version bumping
- [ ] Verify feature flag system works as expected
- [ ] Test monitoring tabs show accurate data
- [ ] Conduct end-to-end testing of admin workflows
- [ ] Perform accessibility audits and fix issues
- [ ] Optimize performance and bundle size

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-09-16 | Initial admin system documentation |

## References

- [React Documentation](https://reactjs.org/)
- [TanStack React Query](https://tanstack.com/query/v4/docs/react/overview)
- [Supabase Authentication](https://supabase.com/docs/guides/auth)
- [Shadcn UI Documentation](https://ui.shadcn.com/docs)
- [Radix UI Primitives](https://radix-ui.com/primitives)
- [WCAG 2.1 Guidelines](https://www.w3.org/TR/WCAG21/)
- [Semantic Versioning](https://semver.org/)
- [Feature Flag Best Practices](https://martinfowler.com/articles/feature-toggles.html)

---
*This document is the single source of truth for the Pente Fino admin system. All admin interface implementations must adhere to these specifications.*