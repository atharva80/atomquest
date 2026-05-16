// ============================================
// Component — Data Table (Generic)
// ============================================
// FILE: src/components/shared/data-table.tsx
//
// PURPOSE:
//   Reusable, sortable, filterable data table.
//   Used across admin pages, team views, and audit logs.
//
// PROPS:
//   - columns: Array<{ key: string, label: string, sortable?: boolean, render?: (value, row) => ReactNode }>
//   - data: any[]
//   - searchable?: boolean — shows search input
//   - searchPlaceholder?: string
//   - pagination?: boolean — shows pagination controls
//   - pageSize?: number — default 10
//   - emptyMessage?: string
//   - onRowClick?: (row: any) => void
//
// IMPLEMENTATION:
//   1. Client Component
//   2. Table with header row (sortable columns have sort indicator)
//   3. Click column header → toggle sort (asc/desc/none)
//   4. Search: filters across all string columns (client-side)
//   5. Pagination: prev/next + page numbers
//   6. Empty state: centered message with illustration
//   7. Loading state: skeleton rows
//   8. Built on top of shadcn Table primitive
//
// DEPENDS ON:
//   - @/components/ui/table (shadcn)
//   - @/components/shared/loading-skeleton
//   - @/components/shared/empty-state
// ============================================
