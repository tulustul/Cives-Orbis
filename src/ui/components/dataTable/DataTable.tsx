import clsx from "clsx";
import React, { useState, useMemo } from "react";

export type SortDirection = "asc" | "desc";

export interface ColumnDef<T> {
  id: string;
  label: React.ReactNode;
  accessor: (row: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({ data, columns, onRowClick }: DataTableProps<T>) {
  const [sortState, setSortState] = useState<{
    columnId: string;
    direction: SortDirection;
  } | null>(null);

  const sortedData = useMemo(() => {
    if (!sortState) return data;

    const { columnId, direction } = sortState;
    const column = columns.find((col) => col.id === columnId);

    if (!column) return data;

    return [...data].sort((a, b) => {
      const aValue = column.accessor(a);
      const bValue = column.accessor(b);

      if (typeof aValue === "string" && typeof bValue === "string") {
        return direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return direction === "asc" ? aValue - bValue : bValue - aValue;
      }

      const aString = String(aValue);
      const bString = String(bValue);

      return direction === "asc"
        ? aString.localeCompare(bString)
        : bString.localeCompare(aString);
    });
  }, [data, sortState, columns]);

  function handleSort(columnId: string) {
    setSortState((prevSort) => {
      if (prevSort?.columnId === columnId) {
        return {
          columnId,
          direction: prevSort.direction === "asc" ? "desc" : "asc",
        };
      }

      return { columnId, direction: "desc" };
    });
  }

  function renderSortIndicator(columnId: string) {
    return (
      <span
        className={clsx(
          "ml-2 text-xs",
          sortState?.columnId !== columnId && "opacity-0",
        )}
      >
        {sortState?.direction === "asc" ? "▲" : "▼"}
      </span>
    );
  }

  if (!data.length) {
    return (
      <div className="text-center text-2xl font-semibold">
        No data available
      </div>
    );
  }

  return (
    <div className={`flex flex-col overflow-y-auto scrollbar-thin`}>
      <table className="w-full border-collapse table-auto">
        <thead className="sticky top-0 z-10 bg-[#f0dfbc]">
          <tr>
            <th />
            {columns.map((column) => (
              <th
                key={column.id}
                className={`px-4 py-3 text-left font-semibold`}
                onClick={() => handleSort(column.id)}
              >
                <div className="flex items-center cursor-pointer">
                  {column.label}
                  {renderSortIndicator(column.id)}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="overflow-auto scrollbar-thin">
          {sortedData.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={clsx(
                "odd:bg-white/10 even:bg-white/25 hover:bg-black/5",
                onRowClick ? "cursor-pointer" : "",
              )}
              onClick={() => (onRowClick ? onRowClick(row) : null)}
            >
              <td className="px-4 py-3 font-medium">{rowIndex + 1}</td>
              {columns.map((column) => {
                const value = column.accessor(row);
                return (
                  <td key={column.id} className={`px-4 py-3 font-medium`}>
                    {value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
