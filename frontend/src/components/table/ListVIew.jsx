import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import { useState } from 'react';

const ListView = ({ columns, data, pageSize, setPageSize }) => {
  // assume you manage pageIndex/pageSize in parent and pass them down
  const [pageIndex, setPageIndex] = useState(0);

  const table = useReactTable({
    data: data?.content ?? [], // 서버에서 받은 현재 페이지 데이터
    columns,
    getCoreRowModel: getCoreRowModel(),
    // pagination 관련은 전부 제거
  });

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'end' }}>
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
          }}
        >
          {[10, 20, 30, 50, 100].map((n) => (
            <option key={n} value={n}>
              {n}개씩 보기
            </option>
          ))}
        </select>
      </div>

      <table
        style={{
          width: '1500px',
          border: '1px solid #ddd',
          borderCollapse: 'collapse',
        }}
      >
        <thead style={{ borderBottom: '1px solid #ddd' }}>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr
              key={headerGroup.id}
              style={{
                height: '78px',
                backgroundColor: '#E0E0E0',
              }}
            >
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>

        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className='text-[15px] h-[64px]'
              style={{ borderBottom: '1px solid #ddd' }}
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  style={{ padding: '8px', textAlign: 'center' }}
                  onClick={() => {}}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

export default ListView;
