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

'use client';

import { ReactNode, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

function HighlightText({ text, highlight }: { text: string; highlight: string }) {
  if (!highlight.trim()) return <>{text}</>;
  
  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === highlight.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200 text-zinc-900 rounded px-0.5">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export type ColumnDef<T> = {
  id?: string;
  accessorKey?: keyof T | string;
  header: ReactNode;
  cell?: (context: { row: { original: T } }) => ReactNode;
};

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  searchKey,
}: {
  columns: ColumnDef<T>[];
  data: T[];
  searchKey?: keyof T | string;
}) {
  const [search, setSearch] = useState('');

  const filteredData = useMemo(() => {
    if (!searchKey || !search.trim()) return data;
    const key = String(searchKey);
    return data.filter((row) =>
      String(row[key] ?? '').toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search, searchKey]);

  return (
    <div className="space-y-3">
      {searchKey ? (
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-zinc-400 text-[18px]">search</span>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by title..."
            className="max-w-sm"
          />
        </div>
      ) : null}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={String(column.id ?? column.accessorKey ?? column.header)}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((column) => {
                    const key = String(column.id ?? column.accessorKey ?? column.header);
                    const searchKeyStr = String(searchKey);
                    const isSearchColumn = column.accessorKey === searchKeyStr;
                    const rowValue = row[searchKeyStr];
                    const rowValueStr = typeof rowValue === 'string' ? rowValue : '';
                    
                    return (
                      <TableCell key={key}>
                        {isSearchColumn && search && rowValueStr ? (
                          <HighlightText text={rowValueStr} highlight={search} />
                        ) : (
                          column.cell
                            ? column.cell({ row: { original: row } })
                            : String(row[key] ?? '')
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
