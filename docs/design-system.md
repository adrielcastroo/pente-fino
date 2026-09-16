# Design System Documentation

## Overview

This document defines the design system for the Pente Fino application, providing a single source of truth for UI/UX standards, components, and interactions. The design system ensures consistency, accessibility, and maintainability across the application.

## Design Tokens

### Color Palette

Colors are defined as CSS custom properties (variables) in `src/index.css` and are accessible via the design system tokens.

#### Light Theme

| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | `201 96% 32%` (Industrial sky-700) | Primary actions, links, active states |
| `--primary-foreground` | `210 40% 98%` | Text on primary backgrounds |
| `--background` | `210 20% 98%` | Page background |
| `--foreground` | `222 47% 11%` | Primary text |
| `--card` | `0 0% 100%` | Card backgrounds |
| `--card-foreground` | `222 47% 11%` | Text on cards |
| `--muted` | `215 16% 95%` | Secondary backgrounds |
| `--muted-foreground` | `215 16% 47%` | Secondary text |
| `--accent` | `201 94% 94%` | Accent elements |
| `--accent-foreground` | `201 96% 22%` | Text on accent |
| `--destructive` | `0 72% 51%` | Error/destructive actions |
| `--destructive-foreground` | `210 40% 98%` | Text on destructive |
| `--success` | `142 71% 36%` | Success indicators |
| `--success-foreground` | `210 40% 98%` | Text on success |
| `--warning` | `32 95% 44%` | Warning indicators |
| `--warning-foreground` | `210 40% 98%` | Text on warning |
| `--lock` | `262 83% 58%` | Lock/security indicators |
| `--lock-foreground` | `210 40% 98%` | Text on lock |
| `--border` | `215 20% 89%` | Borders and dividers |
| `--input` | `215 20% 89%` | Input fields |
| `--ring` | `201 96% 32%` | Focus rings |
| `--radius` | `0.375rem` | Border radius (industrial, not rounded) |
| `--navy` | `222 47% 11%` | Dark navy for text |
| `--navy-2` | `217 33% 17%` | Lighter navy |
| `--navy-3` | `215 20% 65%` | Medium navy |
| `--sidebar-background` | `217 33% 17%` | Sidebar background |
| `--sidebar-foreground` | `215 20% 75%` | Sidebar text |
| `--sidebar-primary` | `201 96% 45%` | Sidebar primary elements |
| `--sidebar-primary-foreground` | `210 40% 98%` | Text on sidebar primary |
| `--sidebar-accent` | `217 33% 22%` | Sidebar accent |
| `--sidebar-accent-foreground` | `210 40% 98%` | Text on sidebar accent |
| `--sidebar-border` | `217 33% 22%` | Sidebar borders |
| `--sidebar-ring` | `201 96% 45%` | Sidebar focus rings |

#### Dark Theme Overrides

The dark theme is applied via the `.dark` class on the `<html>` element. Values are inverted or adjusted for dark backgrounds.

### Typography

#### Font Families

- **Sans-serif**: `'Geist Variable', 'Geist', 'Inter', 'system-ui', 'sans-serif'`
- **Mono**: `'Geist Mono Variable', 'Geist Mono', 'IBM Plex Mono', 'monospace'`
- **Headings**: `'Sora', sans-serif'` (used for h1-h3)

#### Fluid Typography

Font sizes use `clamp()` for responsive scaling:

- `h1`: `clamp(1.5rem, 1.15rem + 1.5vw, 2.25rem)` (24px-36px)
- `h2`: `clamp(1.25rem, 1rem + 1vw, 1.75rem)` (20px-28px)
- `h3`: `clamp(1.05rem, 0.9rem + 0.6vw, 1.35rem)` (17px-22px)
- `body`: `1rem` (16px)

#### Line Heights

- Tight: `1.15`
- Snug: `1.2`
- Normal: `1.5`

### Spacing

Spacing follows a 4px base grid:

| Token | Value | Pixels |
|-------|-------|--------|
| `xs` | `0.25rem` | 4px |
| `sm` | `0.5rem` | 8px |
| `md` | `1rem` | 16px |
| `lg` | `1.5rem` | 24px |
| `xl` | `2rem` | 32px |

### Border Radius

All components use `--radius: 0.375rem` (6px) for an industrial aesthetic—avoiding the overly rounded "consumer SaaS" look.

### Shadows

Minimalist shadows for depth without visual noise:

- Card shadow: `0 1px 2px 0 rgb(15 23 42 / 0.04)`
- Overlay/popover shadow: `0 10px 25px -5px rgb(15 23 42 / 0.15)`

## Component Library

### Foundational Components

#### Button

Variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`

Props:
- `variant`: string (default: 'default')
- `size`: string (default: 'md') – sm, md, lg
- `disabled`: boolean
- `children`: ReactNode

#### Input

Types: `text`, `textarea`, `select`, `checkbox`, `radio`

Props:
- `type`: string
- `label`: string
- `placeholder`: string
- `value`: string
- `onChange`: function
- `disabled`: boolean
- `required`: boolean

#### Card

Compositional components:
- `CardHeader`: Header section
- `CardTitle`: Title element
- `CardDescription`: Description/subtitle
- `CardContent`: Main content area
- `CardFooter`: Footer section

#### Badge

Variants: `default`, `secondary`, `destructive`, `outline`

Props:
- `variant`: string (default: 'default')
- `children`: ReactNode

#### Separator

Simple visual divider with `border-top: 1px solid var(--border)`.

#### Skeleton

Loading placeholders with pulse animation.

### Layout Components

#### StatCard

Displays a key metric with icon, label, and value.

Props:
- `icon`: ReactNode
- `label`: string
- `value`: string \| number
- `variant`: 'default' \| 'success' \| 'warning' \| 'error' (default: 'default')

#### CardShell

Section container with header and content.

Props:
- `title`: string
- `icon`: ReactNode
- `children`: ReactNode

#### SettingsCard

Form layout for settings pages.

### Navigation Components

#### Tabs

Tab navigation system with accessible keyboard navigation.

Props:
- `tabs`: Array of `{ label: string, value: string }`
- `value`: string (current tab)
- `onValueChange`: function

#### Sidebar

Collapsible navigation sidebar with icons and labels.

Props:
- `sections`: Array of navigation sections
- `activeKey`: string
- `onSelect`: function

### Data Display Components

#### Table

Data table with sorting, filtering, and pagination.

Props:
- `columns`: Array of column definitions
- `data`: Array of row data
- `sortable`: boolean (default: true)
- `filterable`: boolean (default: true)

#### List

Item list with optional icons and actions.

Props:
- `items`: Array
- `renderItem`: function
- `onItemClick`: function

### Feedback Components

#### Toast

Notification system with auto-dismiss and action buttons.

Props:
- `title`: string
- `description`: string
- `action`: object (label, onClick)
- `duration`: number (default: 5000)
- `position`: string (default: 'top-right')

#### Alert

Warning/info/error messages.

Props:
- `variant`: 'default' \| 'secondary' \| 'destructive' \| 'outline'
- `title`: string
- `description`: string

#### Modal

Dialog overlay with header, content, and footer.

Props:
- `isOpen`: boolean
- `onClose`: function
- `title`: string
- `children`: ReactNode

## Usage Guidelines

### 1. Use Design Tokens

Always reference design tokens instead of hardcoded values:

```css
/* Good */
color: var(--foreground);
background-color: var(--card);
border-radius: var(--radius);

/* Avoid */
color: #222;
background-color: #fff;
border-radius: 4px;
```

### 2. Use Semantic Variants

Use component variants for semantic meaning:

```tsx
// Success
<Button variant="destructive">Delete</Button>
<Badge variant="success">Success</Badge>
```

### 3. Maintain Consistency

When creating new components:
- Use existing foundational components as building blocks
- Follow the same prop APIs and naming conventions
- Reference design tokens for styling
- Apply consistent spacing and typography

### 4. Accessibility

All components must meet WCAG 2.1 AA standards:
- Proper color contrast (minimum 4.5:1 for text)
- Keyboard navigable
- ARIA labels where appropriate
- Focus visible indicators
- Responsive to user preferences (reduced motion, etc.)

### 5. Theming

The design system supports light and dark themes via the `.dark` class on `<html>`. Components automatically adapt using CSS custom properties.

## Implementation

### Adding New Colors

1. Add CSS custom properties to `src/index.css` under `:root` and `.dark`
2. Export the token in `src/lib/design-tokens.ts` (if needed for JS access)
3. Use the token in components via `var(--token-name)`

### Creating New Components

1. Create the component in `src/components/ui/` or `src/components/design-system/`
2. Use `forwardRef` for DOM refs when needed
3. Apply styling using `cn()` utility for class merging
4. Reference design tokens via CSS variables or the `useDesignSystem` hook
5. Export the component with proper TypeScript interfaces
6. Add stories to Storybook (if applicable)
7. Write unit tests

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-09-16 | Initial design system documentation |

## References

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Shadcn UI Documentation](https://ui.shadcn.com/docs)
- [Radix UI Primitives](https://radix-ui.com/primitives)
- [Lucide React Icons](https://lucide.dev)
- [Class Variance Authority](https://github.com/joebellis/class-variance-authority)
- [clsx](https://github.com/lukeed/clsx)
- [tailwind-merge](https://github.com/drcmda/tailwind-merge)

---
*This document is the single source of truth for the Pente Fino design system. All UI/UX implementations must adhere to these specifications.*