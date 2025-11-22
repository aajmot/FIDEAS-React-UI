import React, { useState, useEffect } from 'react';
import { Printer } from 'lucide-react';
import DataTable from '../common/DataTable';
import SalesInvoiceForm from './SalesInvoiceForm';
import SalesInvoiceView from './SalesInvoiceView';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface SalesInvoice {
  id: number;
  invoice_number: string;
  invoice_date: string;
  customer_id: number;
  customer_name: string;
  due_date: string;
  total_amount: number;
  status: string;
}

const SalesInvoiceManagement: React.FC = () => {
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [resetForm, setResetForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingInvoiceId, setViewingInvoiceId] = useState<number | null>(null);
  const { showToast } = useToast();

  const pageSize = 10;

  useEffect(() => {
    loadInvoices();
  }, [currentPage, searchTerm]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/invoice/sales-invoices', {
        params: {
          page: currentPage,
          per_page: pageSize,
          search: searchTerm || undefined
        }
      });
      const data = response.data?.data || response.data;
      const invoicesData = Array.isArray(data) ? data : [];
      
      // Fetch customers to map customer names
      try {
        const customersResponse = await api.get('/api/v1/inventory/customers', {
          params: { per_page: 1000 }
        });
        const customers = customersResponse.data?.data || customersResponse.data || [];
        
        // Map customer names and ensure total_amount_base is used
        const enrichedInvoices = invoicesData.map((invoice: any) => {
          const customer = customers.find((c: any) => c.id === invoice.customer_id);
          return {
            ...invoice,
            customer_name: customer?.name || `Customer ${invoice.customer_id}`,
            total_amount: invoice.total_amount_base || invoice.total_amount || 0
          };
        });
        
        setInvoices(enrichedInvoices);
      } catch (customerError) {
        console.error('Failed to fetch customers:', customerError);
        // Fallback: set invoices without customer names
        setInvoices(invoicesData.map((invoice: any) => ({
          ...invoice,
          customer_name: `Customer ${invoice.customer_id}`,
          total_amount: invoice.total_amount_base || invoice.total_amount || 0
        })));
      }
      
      setTotalItems(response.data?.total || 0);
    } catch (error) {
      showToast('error', 'Failed to load invoices');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInvoiceSaved = () => {
    loadInvoices();
    setResetForm(true);
    setTimeout(() => setResetForm(false), 100);
    showToast('success', 'Sales invoice created successfully');
  };

  const handleToggleCollapse = () => {
    setIsFormCollapsed(!isFormCollapsed);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (search: string) => {
    setSearchTerm(search);
    setCurrentPage(1);
  };

  const handlePrint = (invoice: SalesInvoice) => {
    setViewingInvoiceId(invoice.id);
  };

  const handleBackFromView = () => {
    setViewingInvoiceId(null);
    loadInvoices();
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      approved: 'bg-green-100 text-green-800',
      paid: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const columns = [
    { key: 'id', label: 'ID' },
    {
      key: 'invoice_number',
      label: 'Invoice #',
      render: (value: any, row: SalesInvoice) => (
        <div>
          <div className="font-medium text-xs">{row.invoice_number}</div>
        </div>
      )
    },
    {
      key: 'invoice_date',
      label: 'Date',
      render: (value: string) => (
        <span className="text-xs">
          {new Date(value).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: '2-digit' 
          })}
        </span>
      )
    },
    {
      key: 'customer_name',
      label: 'Customer',
      render: (value: string) => (
        <span className="text-xs">{value}</span>
      )
    },
    {
      key: 'total_amount',
      label: 'Amount',
      render: (value: any) => {
        const amount = typeof value === 'number' ? value : parseFloat(value) || 0;
        return <span className="text-xs font-medium">{amount.toFixed(2)}</span>;
      }
    },
    {
      key: 'due_date',
      label: 'Due Date',
      render: (value: string | undefined) => (
        <span className="text-xs">
          {value ? new Date(value).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: '2-digit' 
          }) : '-'}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(value)}`}>
          {value}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, row: SalesInvoice) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrint(row);
            }}
            className="text-gray-600 hover:text-gray-900"
            title="Print Invoice"
          >
            <Printer className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  // If viewing an invoice, show the view component
  if (viewingInvoiceId !== null) {
    return (
      <SalesInvoiceView
        invoiceId={viewingInvoiceId}
        onBack={() => setViewingInvoiceId(null)}
      />
    );
  }

  return (
    <div className="p-3 sm:p-6">
      <SalesInvoiceForm
        onSave={handleInvoiceSaved}
        isCollapsed={isFormCollapsed}
        onToggleCollapse={handleToggleCollapse}
        resetForm={resetForm}
      />

      <DataTable
        title="Sales Invoices Management"
        columns={columns}
        data={invoices}
        loading={loading}
        pageSize={pageSize}
        totalItems={totalItems}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
      />
    </div>
  );
};

export default SalesInvoiceManagement;
