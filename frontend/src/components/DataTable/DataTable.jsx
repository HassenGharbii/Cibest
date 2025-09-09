import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const DataTable = ({ data = [], columns = [], darkMode, title, icon }) => {
  // Add safety checks for data
  if (!Array.isArray(data)) {
    console.error('DataTable: data is not an array', data);
    data = [];
  }
  
  return (
    <div className={`p-7 rounded-xl shadow-xl border
      ${darkMode
        ? 'bg-gradient-to-br from-[#23243aee] via-[#18192bfa] to-[#23243aee] backdrop-blur-md border-[#35365a] text-slate-200 '
        : 'bg-white border border-gray-200 text-gray-900'}
     hover:shadow-xl transition-all duration-300`}
    >
      <div className="flex items-center gap-2 mb-6 pb-2 border-b border-dashed" style={{borderColor: darkMode ? '#35365a' : '#e5e7eb'}}>
        {icon && (
          <span className={`p-2 rounded-xs shadow ${darkMode ? 'bg-indigo-700 text-yellow-300' : 'bg-indigo-100 text-indigo-600'}`}>
            <FontAwesomeIcon icon={icon} className="text-xl" />
          </span>
        )}
        <h2 className="text-xl font-bold font-sans tracking-tight">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={col}
                  className={`px-4 py-2 font-semibold uppercase tracking-wider ${darkMode ? 'text-indigo-200' : 'text-indigo-700'} text-left`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-6 text-center opacity-60">
                  No data available.
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr key={idx} className={darkMode ? 'hover:bg-[#23243a]' : 'hover:bg-gray-100'}>
                  {columns.map(col => (
                    <td key={col} className="px-4 py-2 border-b border-dashed" style={{borderColor: darkMode ? '#35365a' : '#e5e7eb'}}>
                      {row[col] !== undefined ? row[col] : ''}
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
};

export default DataTable;