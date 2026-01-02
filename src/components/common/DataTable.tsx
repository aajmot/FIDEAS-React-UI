import React, { useState, useMemo } from 'react';
import { Edit, Trash2, Download, ChevronLeft, ChevronRight, Search, ChevronUp, ChevronDown, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  title: string;
  columns: Column[];
  data: any[];
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  onRowClick?: (row: any) => void;
  loading?: boolean;
  pageSize?: number;
  totalItems?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onSearch?: (searchTerm: string) => void;
  onRefresh?: () => void;
  canEdit?: (row: any) => boolean;
  canDelete?: (row: any) => boolean;
}

const DataTable: React.FC<DataTableProps> = ({
  title,
  columns,
  data,
  onEdit,
  onDelete,
  onRowClick,
  loading = false,
  pageSize = 10,
  totalItems,
  currentPage: externalCurrentPage,
  onPageChange,
  onSearch,
  onRefresh,
  canEdit,
  canDelete
}) => {
  const [internalCurrentPage, setInternalCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastServerSearch, setLastServerSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);
  
  const isExternalPagination = totalItems !== undefined && onPageChange !== undefined;
  const currentPage = isExternalPagination ? (externalCurrentPage || 1) : internalCurrentPage;
  
  const filteredAndSortedData = useMemo(() => {
    if (!Array.isArray(data)) {
      return [];
    }
    
    if (isExternalPagination && !searchTerm) {
      return data; // Data is already paginated from API
    }
    
    let filtered = data.filter(row => 
      columns.some(col => 
        String(row[col.key]).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    
    // If external pagination and no client-side results found, trigger server search only once
    if (isExternalPagination && searchTerm && filtered.length === 0 && onSearch && lastServerSearch !== searchTerm) {
      setLastServerSearch(searchTerm);
      onSearch(searchTerm);
      return data; // Return current data while server search is in progress
    }
    
    if (sortConfig) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return filtered;
  }, [data, searchTerm, sortConfig, columns, isExternalPagination, onSearch, lastServerSearch]);
  
  const totalPages = isExternalPagination 
    ? Math.ceil((totalItems || 0) / pageSize)
    : Math.ceil(filteredAndSortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = isExternalPagination 
    ? filteredAndSortedData 
    : filteredAndSortedData.slice(startIndex, startIndex + pageSize);
  
  const handlePageChange = (newPage: number) => {
    const activeElement = document.activeElement;
    if (isExternalPagination) {
      onPageChange(newPage);
    } else {
      setInternalCurrentPage(newPage);
    }
    // Restore focus after state update
    setTimeout(() => {
      if (activeElement && activeElement !== document.body) {
        (activeElement as HTMLElement).focus();
      }
    }, 0);
  };
  
  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };
  
  const exportToExcel = () => {
    const exportData = filteredAndSortedData.map(row => {
      const exportRow: any = {};
      columns.forEach(col => {
        exportRow[col.label] = row[col.key];
      });
      return exportRow;
    });
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, title);
    XLSX.writeFile(wb, `${title.replace(/\s+/g, '_')}.xlsx`);
  };
  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="border-b border-gray-200" style={{ padding: 'var(--erp-section-padding)' }}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center" style={{ gap: 'var(--erp-spacing-sm)' }}>
          <h2 className="font-medium text-gray-800" style={{ fontSize: 'var(--erp-datatable-title-font-size)', lineHeight: 'var(--erp-line-height)' }}>{title}</h2>
          <div className="flex items-center w-full sm:w-auto" style={{ gap: 'var(--erp-spacing-md)' }}>
            <div className="relative flex-1 sm:flex-none">
              {/* <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" style={{ height: 'var(--erp-datatable-icon-size)', width: 'var(--erp-datatable-icon-size)' }} /> */}
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchTerm(value);
                  // Clear search when input is empty
                  if (!value && isExternalPagination && onSearch) {
                    setLastServerSearch('');
                    onSearch('');
                  }
                }}
                className="border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                style={{ paddingLeft: '24px', paddingRight: 'var(--erp-spacing-sm)', height: 'var(--erp-input-height)', fontSize: 'var(--erp-font-size)', width: 'var(--erp-datatable-search-width)' }}
              />
            </div>
            {onRefresh && (
              <button
                onClick={onRefresh}
                title="Refresh"
                className="icon-only flex-shrink-0 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <RefreshCw style={{ height: 'var(--erp-datatable-icon-size)', width: 'var(--erp-datatable-icon-size)' }} />
              </button>
            )}
            <button
              onClick={exportToExcel}
              title="Export to Excel"
              className="icon-only flex-shrink-0 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center justify-center"
            >
              <Download style={{ height: 'var(--erp-datatable-icon-size)', width: 'var(--erp-datatable-icon-size)' }} />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <div className="min-w-full inline-block align-middle">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="text-left font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort(column.key)}
                    style={{ padding: 'var(--erp-row-padding)', fontSize: 'var(--erp-datatable-table-header-font-size)', height: 'var(--erp-table-row-height)', lineHeight: 'var(--erp-table-line-height)', fontWeight: '600' }}
                  >
                    <div className="flex items-center" style={{ gap: 'var(--erp-spacing-xs)' }}>
                      <span className="truncate">{column.label}</span>
                      {sortConfig?.key === column.key && (
                        sortConfig.direction === 'asc' ? 
                          <ChevronUp style={{ height: 'var(--erp-datatable-icon-size)', width: 'var(--erp-datatable-icon-size)' }} /> : 
                          <ChevronDown style={{ height: 'var(--erp-datatable-icon-size)', width: 'var(--erp-datatable-icon-size)' }} />
                      )}
                    </div>
                  </th>
                ))}
                {(onEdit || onDelete) && (
                  <th className="text-left font-medium text-gray-500 uppercase tracking-wider" style={{ padding: 'var(--erp-row-padding)', fontSize: 'var(--erp-datatable-table-header-font-size)', height: 'var(--erp-table-row-height)', lineHeight: 'var(--erp-table-line-height)', fontWeight: '600' }}>
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} className="text-center" style={{ padding: 'var(--erp-spacing-xl)' }}>
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} className="text-center text-gray-500" style={{ padding: 'var(--erp-spacing-xl)', fontSize: 'var(--erp-font-size)' }}>
                    No data available
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, index) => (
                  <tr 
                    key={index} 
                    className={`hover:bg-gray-50 border-b border-gray-100 ${onRowClick ? 'cursor-pointer' : ''}`}
                    onClick={() => onRowClick && onRowClick(row)}
                    style={{ height: 'var(--erp-table-row-height)' }}
                  >
                    {columns.map((column) => (
                      <td key={column.key} className="text-gray-900" style={{ padding: 'var(--erp-cell-padding)', fontSize: 'var(--erp-datatable-font-size)', lineHeight: 'var(--erp-table-line-height)' }}>
                        <div className="max-w-xs truncate">
                          {column.render ? column.render(row[column.key], row) : row[column.key]}
                        </div>
                      </td>
                    ))}
                    {(onEdit || onDelete) && (
                      <td className="font-medium" style={{ padding: 'var(--erp-cell-padding)', fontSize: 'var(--erp-datatable-font-size)', lineHeight: 'var(--erp-table-line-height)' }}>
                        <div className="datatable-actions">
                          {onEdit && (
                            <Edit
                              onClick={(e) => {
                                e.stopPropagation();
                                (canEdit ? canEdit(row) : true) && onEdit(row);
                              }}
                              className={`cursor-pointer ${
                                canEdit && !canEdit(row)
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'text-blue-600 hover:text-blue-900'
                              }`}
                              style={{ height: 'var(--erp-datatable-icon-size)', width: 'var(--erp-datatable-icon-size)' }}
                            />
                          )}
                          {onDelete && (
                            <Trash2
                              onClick={(e) => {
                                e.stopPropagation();
                                (canDelete ? canDelete(row) : true) && onDelete(row);
                              }}
                              className={`cursor-pointer ${
                                canDelete && !canDelete(row)
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'text-red-600 hover:text-red-900'
                              }`}
                              style={{ height: 'var(--erp-datatable-icon-size)', width: 'var(--erp-datatable-icon-size)' }}
                            />
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Pagination */}
      {(totalPages > 1 || (isExternalPagination ? (totalItems || 0) : filteredAndSortedData.length) > 0) && (
        <div className="border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between" style={{ padding: 'var(--erp-section-padding)', gap: 'var(--erp-spacing-sm)' }}>
          <div className="text-gray-700" style={{ fontSize: 'var(--erp-font-size-xs)' }}>
            Showing {startIndex + 1} to {Math.min(startIndex + pageSize, isExternalPagination ? (totalItems || 0) : filteredAndSortedData.length)} of {isExternalPagination ? (totalItems || 0) : filteredAndSortedData.length} entries
            {!isExternalPagination && searchTerm && ` (filtered from ${data.length} total)`}
          </div>
          <div className="flex items-center" style={{ gap: 'var(--erp-spacing-xs)' }}>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handlePageChange(Math.max(currentPage - 1, 1));
              }}
              disabled={currentPage === 1 || totalPages <= 1}
              className="rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center justify-center"
              type="button"
              style={{ padding: 'var(--erp-spacing-sm)', height: 'var(--erp-button-height)', width: 'var(--erp-button-height)' }}
            >
              <ChevronLeft style={{ height: 'var(--erp-datatable-pagination-icon-size)', width: 'var(--erp-datatable-pagination-icon-size)' }} />
            </button>
            <span style={{ padding: '0 var(--erp-spacing-sm)', fontSize: 'var(--erp-font-size-xs)' }}>
              Page {currentPage} of {Math.max(totalPages, 1)}
            </span>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handlePageChange(Math.min(currentPage + 1, totalPages));
              }}
              disabled={currentPage === totalPages || totalPages <= 1}
              className="rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center justify-center"
              type="button"
              style={{ padding: 'var(--erp-spacing-sm)', height: 'var(--erp-button-height)', width: 'var(--erp-button-height)' }}
            >
              <ChevronRight style={{ height: 'var(--erp-datatable-pagination-icon-size)', width: 'var(--erp-datatable-pagination-icon-size)' }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;