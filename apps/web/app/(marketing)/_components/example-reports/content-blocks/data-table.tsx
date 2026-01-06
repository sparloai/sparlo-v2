interface DataTableProps {
  headers: string[];
  rows: (string | React.ReactNode)[][];
}

export function DataTable({ headers, rows }: DataTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50">
            {headers.map((header, i) => (
              <th
                key={i}
                className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-500"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-zinc-100 last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-zinc-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
