"use client";

import { useMemo, useState } from "react";

export type Column<T> = {
  header: string;
  cell: (row: T) => React.ReactNode;
  mono?: boolean;
};

export type ToggleFilter<T> = {
  label: string;
  predicate: (row: T) => boolean;
};

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  searchText,
  toggleFilter,
  initialQuery,
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string | number;
  searchText: (row: T) => string;
  toggleFilter?: ToggleFilter<T>;
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery ?? "");
  const [issuesOnly, setIssuesOnly] = useState(false);

  const filtered = useMemo(() => {
    let out = rows;
    if (toggleFilter && issuesOnly) {
      out = out.filter(toggleFilter.predicate);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      out = out.filter((r) => searchText(r).toLowerCase().includes(q));
    }
    return out;
  }, [rows, query, issuesOnly, searchText, toggleFilter]);

  return (
    <div className="rounded-lg border border-line bg-surface overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
          className="flex-1 min-w-[180px] rounded-md border border-line bg-paper px-3 py-1.5 text-sm outline-none focus:border-accent"
        />
        {toggleFilter && (
          <label className="flex items-center gap-2 text-sm text-muted whitespace-nowrap">
            <input
              type="checkbox"
              checked={issuesOnly}
              onChange={(e) => setIssuesOnly(e.target.checked)}
            />
            {toggleFilter.label}
          </label>
        )}
        <span className="text-xs text-muted ml-auto">
          {filtered.length} of {rows.length}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-2 text-left text-xs text-muted">
              {columns.map((c) => (
                <th key={c.header} className="px-4 py-2 font-medium whitespace-nowrap">
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-6 text-center text-muted">
                  No rows match.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={rowKey(row)} className="border-b border-line last:border-b-0">
                  {columns.map((c) => (
                    <td
                      key={c.header}
                      className={`px-4 py-2 align-middle ${c.mono ? "font-mono" : ""}`}
                    >
                      {c.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
