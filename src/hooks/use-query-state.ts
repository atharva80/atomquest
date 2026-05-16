/**
 * Hook — useQueryState (nuqs wrapper)
 *
 * Convenience wrapper around nuqs for common URL state patterns.
 */

'use client';

import { useQueryState, parseAsString, parseAsInteger } from 'nuqs';
import { QuarterType, GoalStatus } from '@/types';

export function useQuarterFilter() {
  return useQueryState('quarter', parseAsString.withDefault(''));
}

export function useDepartmentFilter() {
  return useQueryState('department', parseAsString.withDefault(''));
}

export function useStatusFilter() {
  return useQueryState('status', parseAsString.withDefault(''));
}

export function useSearchFilter() {
  // Can add a debounce mechanism if needed on the UI side
  return useQueryState('search', parseAsString.withDefault(''));
}

export function usePagination() {
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [pageSize, setPageSize] = useQueryState('pageSize', parseAsInteger.withDefault(10));
  
  return { page, pageSize, setPage, setPageSize };
}

export function useTabState(defaultTab: string) {
  return useQueryState('tab', parseAsString.withDefault(defaultTab));
}
