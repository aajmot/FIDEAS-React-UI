import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import SearchableDropdown from '../common/SearchableDropdown';
import DatePicker from '../common/DatePicker';
import DataTable from '../common/DataTable';
import ConfirmationModal from '../common/ConfirmationModal';
import { diagnosticService } from '../../services/api';
import { sampleCollectionService } from '../../services/modules/health/sampleCollectionService';
import { employeeService } from '../../services';
import { useToast } from '../../context/ToastContext';
import { formatUTCToLocal } from '../../utils/dateUtils';

interface SampleCollection {
  id: number;
  collection_number: string;
  test_order_id: number;
  test_order_number: string;
  patient_name: string;
  collection_date: string;
  collected_by: string;
  status: string;
  notes?: string;
}

interface CollectionItem {
  test_order_item_id: number;
  test_name: string;
  sample_type: string;
  collection_method_id: number;
  collection_method_name: string;
  required_volume: number;
  collected_volume: number;
}

const SampleCollectionManagement: React.FC = () => {
  const [collections, setCollections] = useState<SampleCollection[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [resetForm, setResetForm] = useState(false);
  const [editingCollection, setEditingCollection] = useState<SampleCollection | null>(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, collectionId: null as number | null, collectionNumber: '' });
  const [testOrders, setTestOrders] = useState<any[]>([]);
  const [testOrderItems, setTestOrderItems] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [collectionMethodsByType, setCollectionMethodsByType] = useState<{[key: string]: any[]}>({});
  
  const generateCollectionNumber = () => {
    const now = new Date();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const tenantId = user.tenant_id || 1;
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const fff = String(now.getMilliseconds()).padStart(3, '0');
    return `SC-${tenantId}${dd}${mm}${yyyy}${hh}${min}${ss}${fff}`;
  };

  const [formData, setFormData] = useState({
    collection_number: generateCollectionNumber(),
    test_order_id: '',
    patient_id: '',
    patient_name: '',
    patient_phone: '',
    collection_date: new Date().toISOString().split('T')[0],
    collected_by: '',
    collected_by_id: '',
    collector_phone: '',
    status: 'COLLECTED',
    notes: ''
  });

  const [items, setItems] = useState<CollectionItem[]>([{
    test_order_item_id: 0,
    test_name: '',
    sample_type: '',
    collection_method_id: 0,
    collection_method_name: '',
    required_volume: 0,
    collected_volume: 0
  }]);

  const { showToast } = useToast();

  useEffect(() => {
    loadCollections();
    loadTestOrders();
    loadEmployees();
  }, []);

  useEffect(() => {
    if (resetForm) {
      setFormData({
        collection_number: generateCollectionNumber(),
        test_order_id: '',
        patient_id: '',
        patient_name: '',
        patient_phone: '',
        collection_date: new Date().toISOString().split('T')[0],
        collected_by: '',
        collected_by_id: '',
        collector_phone: '',
        status: 'COLLECTED',
        notes: ''
      });
      setItems([{
        test_order_item_id: 0,
        test_name: '',
        sample_type: '',
        collection_method_id: 0,
        collection_method_name: '',
        required_volume: 0,
        collected_volume: 0
      }]);
      setTestOrderItems([]);
    }
  }, [resetForm]);

  useEffect(() => {
    if (editingCollection) {
      loadEditData(editingCollection.id);
    }
  }, [editingCollection]);

  const loadEditData = async (id: number) => {
    try {
      const response = await sampleCollectionService.getSampleCollection(id);
      const data = response.data;
      setFormData({
        collection_number: data.collection_number || '',
        test_order_id: data.test_order_id?.toString() || '',
        patient_id: data.patient_id?.toString() || '',
        patient_name: data.patient_name || '',
        patient_phone: data.patient_phone || '',
        collection_date: data.collection_date ? new Date(data.collection_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        collected_by: data.collected_by || '',
        collected_by_id: data.collected_by_id?.toString() || '',
        collector_phone: data.collector_phone || '',
        status: data.status || 'COLLECTED',
        notes: data.notes || ''
      });
      
      if (data.test_order_id) {
        await loadTestOrderDetails(data.test_order_id);
      }
      
      if (data.items && data.items.length > 0) {
        setItems(data.items.map((item: any) => ({
          test_order_item_id: item.test_order_item_id || 0,
          test_name: item.test_name || '',
          sample_type: item.sample_type || '',
          collection_method_id: item.collection_method_id || 0,
          collection_method_name: item.collection_method_name || '',
          required_volume: item.required_volume || 0,
          collected_volume: item.collected_volume || 0
        })));
      }
    } catch (error) {
      showToast('error', 'Failed to load sample collection details');
    }
  };

  const loadCollections = async () => {
    setLoading(true);
    try {
      const response = await sampleCollectionService.getSampleCollections();
      setCollections(response.data);
    } catch (error) {
      showToast('error', 'Failed to load sample collections');
    } finally {
      setLoading(false);
    }
  };

  const loadTestOrders = async (search: string = '') => {
    try {
      const response = await diagnosticService.getTestOrders({ search, per_page: 100,status:["ORDERED"] });
      setTestOrders(response.data);
      return response.data.map((order: any) => ({
        value: order.id.toString(),
        label: `${order.test_order_number} - ${order.patient_name}`
      }));
    } catch (error) {
      return [];
    }
  };

  const loadEmployees = async (search: string = '') => {
    try {
      const response = await employeeService.getEmployees({ search, per_page: 100 });
      setEmployees(response.data);
      return response.data.map((emp: any) => ({
        value: emp.id.toString(),
        label: `${emp.employee_name} | ${emp.employment_type}`
      }));
    } catch (error) {
      return [];
    }
  };

  const loadTestOrderDetails = async (orderId: number) => {
    try {
      const response = await diagnosticService.getTestOrder(orderId);
      const orderData = response.data;
      
      setFormData(prev => ({
        ...prev,
        patient_id: orderData.patient_id?.toString() || '',
        patient_name: orderData.patient_name || '',
        patient_phone: orderData.patient_phone || ''
      }));
      
      if (orderData.items && orderData.items.length > 0) {
        setTestOrderItems(orderData.items);
        
        // Load collection methods for BLOOD first
        const methods = await loadCollectionMethods('BLOOD');
        setCollectionMethodsByType(prev => ({ ...prev, BLOOD: methods }));
        
        // Auto-populate items with BLOOD sample type and first collection method
        const firstMethodId = methods.length > 0 ? Number(methods[0].value) : 0;
        const firstMethodName = methods.length > 0 ? methods[0].label : '';
        
        const newItems = orderData.items.map((item: any) => ({
          test_order_item_id: item.id || 0,
          test_name: item.test_name || item.panel_name || '',
          sample_type: 'BLOOD',
          collection_method_id: firstMethodId,
          collection_method_name: firstMethodName,
          required_volume: 0,
          collected_volume: 0
        }));
        setItems(newItems);
      }
    } catch (error) {
      showToast('error', 'Failed to load test order details');
    }
  };

  const loadCollectionMethods = async (sampleType: string) => {
    console.log("sampleType",sampleType)
    if (!sampleType) return [];
    try {
      const response = await sampleCollectionService.getSampleCollectionMethods(sampleType);
      return response.data.map((method: any) => ({
        value: method.id.toString(),
        label: method.method_name
      }));
    } catch (error) {
      return [];
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTestOrderChange = async (value: string | number | (string | number)[]) => {
    const orderId = Number(value);
    setFormData(prev => ({ ...prev, test_order_id: value.toString() }));
    if (orderId > 0) {
      await loadTestOrderDetails(orderId);
    } else {
      setFormData(prev => ({
        ...prev,
        patient_id: '',
        patient_name: '',
        patient_phone: ''
      }));
      setTestOrderItems([]);
      setItems([{
        test_order_item_id: 0,
        test_name: '',
        sample_type: '',
        collection_method_id: 0,
        collection_method_name: '',
        required_volume: 0,
        collected_volume: 0
      }]);
    }
  };

  const handleTestOrderItemChange = (index: number, value: string | number | (string | number)[]) => {
    const itemId = Number(value);
    const orderItem = testOrderItems.find(item => item.id === itemId);
    
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      test_order_item_id: itemId,
      test_name: orderItem?.test_name || orderItem?.panel_name || ''
    };
    setItems(newItems);
  };

  const handleSampleTypeChange = async (index: number, value: string | number | (string | number)[]) => {
    const sampleType = value.toString();
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      sample_type: sampleType,
      collection_method_id: 0,
      collection_method_name: ''
    };
    setItems(newItems);
    
    // Load collection methods for this sample type
    if (sampleType && !collectionMethodsByType[sampleType]) {
      const methods = await loadCollectionMethods(sampleType);
      setCollectionMethodsByType(prev => ({ ...prev, [sampleType]: methods }));
    }
  };

  const handleCollectionMethodChange = (index: number, value: string | number | (string | number)[], methods: any[]) => {
    const methodId = Number(value);
    const method = methods.find(m => m.value === value.toString());
    
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      collection_method_id: methodId,
      collection_method_name: method?.label || ''
    };
    setItems(newItems);
  };

  const handleItemChange = (index: number, field: keyof CollectionItem, value: number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, {
      test_order_item_id: 0,
      test_name: '',
      sample_type: '',
      collection_method_id: 0,
      collection_method_name: '',
      required_volume: 0,
      collected_volume: 0
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.test_order_id) {
      showToast('error', 'Please select a test order');
      return;
    }

    const validItems = items.filter(item => item.test_order_item_id > 0 && item.sample_type);

    if (validItems.length === 0) {
      showToast('error', 'Please add at least one collection item with sample type');
      return;
    }

    const itemsData = validItems.map((item, idx) => ({
      line_no: idx + 1,
      test_order_item_id: item.test_order_item_id,
      sample_type: item.sample_type,
      collection_method_id: item.collection_method_id > 0 ? item.collection_method_id : null,
      collection_method_name: item.collection_method_name,
      required_volume: item.required_volume,
      collected_volume: item.collected_volume
    }));

    try {
      const selectedTestOrder = testOrders.find(order => order.id === Number(formData.test_order_id));
      
      const collectionData = {
        collection_number: formData.collection_number,
        test_order_id: Number(formData.test_order_id),
        test_order_no: selectedTestOrder?.test_order_number || '',
        patient_id: formData.patient_id ? Number(formData.patient_id) : null,
        patient_name: formData.patient_name,
        patient_phone: formData.patient_phone,
        collection_date: new Date(formData.collection_date).toISOString(),
        collector_id: formData.collected_by_id ? Number(formData.collected_by_id) : null,
        collector_name: formData.collected_by,
        collector_phone: formData.collector_phone,
        status: formData.status,
        notes: formData.notes || null,
        items: itemsData
      };

      let response;
      if (editingCollection?.id) {
        response = await sampleCollectionService.updateSampleCollection(editingCollection.id, collectionData);
      } else {
        response = await sampleCollectionService.createSampleCollection(collectionData);
      }
      
      if (response.success) {
        showToast('success', editingCollection ? 'Sample collection updated successfully' : 'Sample collection created successfully');
        loadCollections();
        loadTestOrders();
        handleCancel();
      } else {
        showToast('error', response.message || 'Failed to save sample collection');
      }
    } catch (error) {
      showToast('error', 'Failed to save sample collection');
    }
  };

  const handleCancel = () => {
    setEditingCollection(null);
    setTestOrderItems([]);
    setResetForm(true);
    setTimeout(() => setResetForm(false), 100);
  };

  const handleEdit = (collection: SampleCollection) => {
    setEditingCollection(collection);
    setIsFormCollapsed(false);
  };

  const handleDeleteClick = (collection: SampleCollection) => {
    setDeleteModal({ isOpen: true, collectionId: collection.id, collectionNumber: collection.collection_number });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.collectionId) return;
    
    try {
      await sampleCollectionService.deleteSampleCollection(deleteModal.collectionId);
      setCollections(collections.filter(c => c.id !== deleteModal.collectionId));
      showToast('success', 'Sample collection deleted successfully');
      setDeleteModal({ isOpen: false, collectionId: null, collectionNumber: '' });
    } catch (error) {
      showToast('error', 'Failed to delete sample collection');
    }
  };

  const columns = [
    {
      key: 'collection_number',
      label: 'Collection Number',
      sortable: true,
    },
    {
      key: 'test_order_no',
      label: 'Test Order',
      sortable: true,
    },
    {
      key: 'patient_name',
      label: 'Patient',
      sortable: true,
    },
    {
      key: 'collection_date',
      label: 'Collection Date',
      sortable: true,
      render: (value: string) => formatUTCToLocal(value),
    },
    {
      key: 'collector_name',
      label: 'Collected By',
      sortable: true,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => (
        <span style={{
          padding: '1px 6px',
          fontSize: 'var(--erp-font-size-xs)',
          borderRadius: '4px',
          backgroundColor: value === 'COLLECTED' ? '#dcfce7' : value === 'PENDING' ? '#fef3c7' : '#f3f4f6',
          color: value === 'COLLECTED' ? '#166534' : value === 'PENDING' ? '#854d0e' : '#6b7280'
        }}>
          {value || 'Pending'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, collection: SampleCollection) => (
        <div className="flex space-x-0">
          <button
            onClick={() => handleEdit(collection)}
            className="text-blue-600 hover:text-blue-800"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteClick(collection)}
            className="text-red-600 hover:text-red-800"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: 'var(--erp-spacing-lg)' }}>
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200 flex justify-between items-center" style={{ padding: 'var(--erp-section-padding)' }}>
          <h2 className="font-medium text-gray-800" style={{ fontSize: 'var(--erp-datatable-title-font-size)', lineHeight: 'var(--erp-line-height)' }}>
            Create Sample Collection
          </h2>
          <button
            type="button"
            onClick={() => setIsFormCollapsed(!isFormCollapsed)}
            className="text-gray-500 hover:text-gray-700"
          >
            {isFormCollapsed ? <ChevronDown className="erp-form-btn-icon" style={{ marginRight: 0 }} /> : <ChevronUp className="erp-form-btn-icon" style={{ marginRight: 0 }} />}
          </button>
        </div>

        {!isFormCollapsed && (
          <form onSubmit={handleSubmit} style={{ padding: 'var(--erp-card-padding)' }}>
            <div className="grid grid-cols-1 sm:grid-cols-6" style={{ gap: 'var(--erp-spacing-lg)', marginBottom: 'var(--erp-spacing-xl)' }}>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Collection Number</label>
                <input
                  type="text"
                  name="collection_number"
                  value={formData.collection_number}
                  readOnly
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Test Order *</label>
                <SearchableDropdown
                  options={testOrders.map(order => ({
                    value: order.id.toString(),
                    label: `${order.test_order_number} - ${order.patient_name}`
                  }))}
                  value={formData.test_order_id}
                  onChange={handleTestOrderChange}
                  placeholder="Search test order"
                  multiple={false}
                  searchable={true}
                  onSearch={loadTestOrders}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Patient Name</label>
                <input
                  type="text"
                  name="patient_name"
                  value={formData.patient_name}
                  readOnly
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Patient Phone</label>
                <input
                  type="text"
                  name="patient_phone"
                  value={formData.patient_phone}
                  readOnly
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Collection Date *</label>
                <DatePicker
                  value={formData.collection_date}
                  onChange={(value) => setFormData(prev => ({ ...prev, collection_date: value }))}
                  placeholder="Select date"
                  className="w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Collected By *</label>
                <SearchableDropdown
                  options={employees.map(emp => ({
                    value: emp.id.toString(),
                    label: `${emp.employee_name} | ${emp.employment_type}`
                  }))}
                  value={formData.collected_by_id}
                  onChange={(value) => {
                    const emp = employees.find(e => e.id.toString() === value.toString());
                    setFormData(prev => ({ 
                      ...prev, 
                      collected_by_id: value.toString(),
                      collected_by: emp?.employee_name || '',
                      collector_phone: emp?.phone || ''
                    }));
                  }}
                  onSearch={loadEmployees}
                  placeholder="Search employee"
                  multiple={false}
                  searchable={true}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 mb-6">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <SearchableDropdown
                  options={[
                    { value: 'COLLECTED', label: 'COLLECTED' },
                    { value: 'RECEIVED', label: 'RECEIVED' },
                    { value: 'PROCESSING', label: 'PROCESSING' },
                    { value: 'COMPLETED', label: 'COMPLETED' },
                    { value: 'REJECTED', label: 'REJECTED' }
                  ]}
                  value={formData.status}
                  onChange={(value) => setFormData(prev => ({ ...prev, status: value.toString() }))}
                  placeholder="Select status"
                  multiple={false}
                  searchable={true}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                <input
                  type="text"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                />
              </div>
            </div>

            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-semibold">Collection Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Item
              </button>
            </div>

            <div className="mb-6 overflow-x-auto">
              <table className="border border-gray-200" style={{ minWidth: '1000px', width: '100%' }}>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-left">Sample Type *</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-left">Collection Method</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center">Required Vol</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center">Collected Vol</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-left">Test</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-2 py-2" style={{ minWidth: '150px' }}>
                        <SearchableDropdown
                          options={[
                            { value: 'BLOOD', label: 'Blood' },
                            { value: 'URINE', label: 'Urine' },
                            { value: 'STOOL', label: 'Stool' },
                            { value: 'SPUTUM', label: 'Sputum' },
                            { value: 'SWAB', label: 'Swab' },
                            { value: 'TISSUE', label: 'Tissue' },
                            { value: 'OTHER', label: 'Other' }
                          ]}
                          value={item.sample_type}
                          onChange={(value) => handleSampleTypeChange(index, value)}
                          placeholder="Select type"
                          multiple={false}
                          searchable={true}
                        />
                      </td>
                      <td className="px-2 py-2" style={{ minWidth: '200px' }}>
                        <SearchableDropdown
                          options={collectionMethodsByType[item.sample_type] || []}
                          value={item.collection_method_id.toString()}
                          onChange={(value) => {
                            const methods = collectionMethodsByType[item.sample_type] || [];
                            handleCollectionMethodChange(index, value, methods);
                          }}
                          placeholder="Select method"
                          multiple={false}
                          searchable={true}
                        />
                      </td>
                      <td className="px-2 py-2" style={{ width: '120px' }}>
                        <input
                          type="number"
                          value={item.required_volume}
                          onChange={(e) => handleItemChange(index, 'required_volume', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center"
                          step="0.01"
                        />
                      </td>
                      <td className="px-2 py-2" style={{ width: '120px' }}>
                        <input
                          type="number"
                          value={item.collected_volume}
                          onChange={(e) => handleItemChange(index, 'collected_volume', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center"
                          step="0.01"
                        />
                      </td>
                      <td className="px-2 py-2" style={{ minWidth: '200px' }}>
                        <SearchableDropdown
                          options={testOrderItems.map(orderItem => ({
                            value: orderItem.id.toString(),
                            label: orderItem.test_name || orderItem.panel_name
                          }))}
                          value={item.test_order_item_id.toString()}
                          onChange={(value) => handleTestOrderItemChange(index, value)}
                          placeholder="Select test"
                          multiple={false}
                          searchable={true}
                        />
                      </td>
                      <td className="px-2 py-2 text-center" style={{ width: '80px' }}>
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-800"
                          disabled={items.length === 1}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row justify-end" style={{ gap: 'var(--erp-spacing-sm)' }}>
              <button
                type="button"
                onClick={handleCancel}
                className="erp-form-btn text-gray-700 bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="erp-form-btn text-white bg-primary hover:bg-secondary"
              >
                {editingCollection ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        )}
      </div>

      <DataTable
        title="Sample Collections"
        data={collections}
        columns={columns}
        loading={loading}
      />

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onCancel={() => setDeleteModal({ isOpen: false, collectionId: null, collectionNumber: '' })}
        onConfirm={handleDeleteConfirm}
        title="Delete Sample Collection"
        message={`Are you sure you want to delete sample collection ${deleteModal.collectionNumber}? This action cannot be undone.`}
      />
    </div>
  );
};

export default SampleCollectionManagement;
