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
      <div className="px-3 sm:px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
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
                className="pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-48 h-10"
              />
            </div>
            {onRefresh && (
              <button
                onClick={onRefresh}
                title="Refresh"
                className="flex-shrink-0 p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors mr-2"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={exportToExcel}
              title="Export to Excel"
              className="flex-shrink-0 p-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4" />
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
                    className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort(column.key)}
                  >
                    <div className="flex items-center space-x-1">
                      <span className="truncate">{column.label}</span>
                      {sortConfig?.key === column.key && (
                        sortConfig.direction === 'asc' ? 
                          <ChevronUp className="h-3 w-3 flex-shrink-0" /> : 
                          <ChevronDown className="h-3 w-3 flex-shrink-0" />
                      )}
                    </div>
                  </th>
                ))}
                {(onEdit || onDelete) && (
                  <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} className="px-4 py-8 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} className="px-4 py-8 text-center text-gray-500">
                    No data available
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, index) => (
                  <tr 
                    key={index} 
                    className={`hover:bg-gray-50 border-b border-gray-100 ${onRowClick ? 'cursor-pointer' : ''}`}
                    onClick={() => onRowClick && onRowClick(row)}
                  >
                    {columns.map((column) => (
                      <td key={column.key} className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-gray-900">
                        <div className="max-w-xs truncate">
                          {column.render ? column.render(row[column.key], row) : row[column.key]}
                        </div>
                      </td>
                    ))}
                    {(onEdit || onDelete) && (
                      <td className="px-2 sm:px-4 py-2 text-sm font-medium">
                        <div className="flex space-x-1">
                          {onEdit && (
                            <button
                              onClick={() => (canEdit ? canEdit(row) : true) && onEdit(row)}
                              disabled={canEdit ? !canEdit(row) : false}
                              className={`p-1 rounded ${
                                canEdit && !canEdit(row)
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'text-blue-600 hover:text-blue-900 hover:bg-blue-50'
                              }`}
                            >
                              <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => (canDelete ? canDelete(row) : true) && onDelete(row)}
                              disabled={canDelete ? !canDelete(row) : false}
                              className={`p-1 rounded ${
                                canDelete && !canDelete(row)
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'text-red-600 hover:text-red-900 hover:bg-red-50'
                              }`}
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
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
        <div className="px-3 sm:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
          <div className="text-xs sm:text-sm text-gray-700">
            Showing {startIndex + 1} to {Math.min(startIndex + pageSize, isExternalPagination ? (totalItems || 0) : filteredAndSortedData.length)} of {isExternalPagination ? (totalItems || 0) : filteredAndSortedData.length} entries
            {!isExternalPagination && searchTerm && ` (filtered from ${data.length} total)`}
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handlePageChange(Math.max(currentPage - 1, 1));
              }}
              disabled={currentPage === 1 || totalPages <= 1}
              className="p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              type="button"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm">
              Page {currentPage} of {Math.max(totalPages, 1)}
            </span>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handlePageChange(Math.min(currentPage + 1, totalPages));
              }}
              disabled={currentPage === totalPages || totalPages <= 1}
              className="p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              type="button"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;