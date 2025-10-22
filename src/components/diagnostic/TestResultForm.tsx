import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus, Minus } from 'lucide-react';
import { diagnosticService, clinicService } from '../../services/api';
import DatePicker from '../common/DatePicker';
import SearchableDropdown from '../common/SearchableDropdown';

interface TestResultFormProps {
  testResult?: any;
  onSave: (resultData: any) => void;
  onCancel: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  resetForm?: boolean;
}

const TestResultForm: React.FC<TestResultFormProps> = ({ 
  testResult, 
  onSave, 
  onCancel, 
  isCollapsed, 
  onToggleCollapse, 
  resetForm
}) => {
  const [testOrderOptions, setTestOrderOptions] = useState<{value: string, label: string}[]>([]);
  const [parameterOptions, setParameterOptions] = useState<{value: string, label: string, data?: any}[]>([]);
  const [doctorOptions, setDoctorOptions] = useState<{value: string, label: string}[]>([]);
  const [parametersByTest, setParametersByTest] = useState<{[testName: string]: any[]}>({});
  const [collapsedTests, setCollapsedTests] = useState<{[testName: string]: boolean}>({});
  const [existingResult, setExistingResult] = useState<any | null>(null);
  
  const generateTRNumber = () => {
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
    return `TR-${tenantId}${dd}${mm}${yyyy}${hh}${min}${ss}${fff}`;
  };

  const [formData, setFormData] = useState({
    result_number: testResult?.result_number || generateTRNumber(),
    test_order_id: testResult?.test_order_id || '',
    result_date: testResult?.result_date || new Date().toISOString().split('T')[0],
    overall_report: testResult?.overall_report || '',
    performed_by: testResult?.performed_by || '',
    result_type: testResult?.result_type || 'Parametric',
    notes: testResult?.notes || '',
    doctor_id: testResult?.doctor_id || '',
    license_number: testResult?.license_number || ''
  });

  const [details, setDetails] = useState<any[]>(testResult?.details || [{ 
    parameter_id: '', 
    parameter_name: '', 
    unit: '',
    parameter_value: '', 
    reference_value: '', 
    verdict: '',
    notes: ''
  }]);
  const [files, setFiles] = useState<any[]>(testResult?.files || [{ 
    file_name: '', 
    file_path: '', 
    file_format: '', 
    file_size: 0,
    acquisition_date: new Date().toISOString().split('T')[0],
    description: ''
  }]);

  useEffect(() => {
    loadTestOrders('');
    loadDoctors('');
  }, []);

  const loadDoctors = async (search: string) => {
    try {
      const response = await clinicService.getDoctors({ search, per_page: 50 });
      const options = response.data.map((doctor: any) => ({
        value: doctor.id.toString(),
        label: `${doctor.first_name || ''} ${doctor.last_name || ''} | ${doctor.specialization || 'NA'}`
      }));
      setDoctorOptions(options);
      return options;
    } catch (error) {
      console.error('Error loading doctors:', error);
      return [];
    }
  };

  useEffect(() => {
    const loadFullResult = async () => {
      if (testResult?.id) {
        try {
          const response = await diagnosticService.getTestResult(testResult.id);
          const fullResult = response.data;
          
          if (fullResult.doctor_id) {
            try {
              const doctorResponse = await clinicService.getDoctor(fullResult.doctor_id);
              const doctor = doctorResponse.data;
              const doctorOption = {
                value: doctor.id.toString(),
                label: `${doctor.first_name || ''} ${doctor.last_name || ''} | ${doctor.specialization || 'NA'}`
              };
              setDoctorOptions(prev => {
                const exists = prev.find(d => d.value === doctorOption.value);
                return exists ? prev : [...prev, doctorOption];
              });
            } catch (error) {
              console.error('Error loading doctor:', error);
            }
          }
          
          setFormData({
            result_number: fullResult.result_number,
            test_order_id: fullResult.test_order_id ? fullResult.test_order_id.toString() : '',
            result_date: fullResult.result_date,
            overall_report: fullResult.overall_report || '',
            performed_by: fullResult.performed_by || '',
            result_type: fullResult.result_type || 'Parametric',
            notes: fullResult.notes || '',
            doctor_id: fullResult.doctor_id ? fullResult.doctor_id.toString() : '',
            license_number: fullResult.license_number || ''
          });
          setDetails(fullResult.details || []);
          setFiles(fullResult.files || []);
          setExistingResult(fullResult);
        } catch (error) {
          console.error('Error loading full result:', error);
        }
      }
    };
    
    loadFullResult();
  }, [testResult]);

  useEffect(() => {
    if (resetForm && !testResult) {
      setFormData({
        result_number: generateTRNumber(),
        test_order_id: '',
        result_date: new Date().toISOString().split('T')[0],
        overall_report: '',
        performed_by: '',
        result_type: 'Parametric',
        notes: '',
        doctor_id: '',
        license_number: ''
      });
      setDetails([{ 
        parameter_id: '', 
        parameter_name: '', 
        unit: '',
        parameter_value: '', 
        reference_value: '', 
        verdict: '',
        notes: ''
      }]);
      setFiles([{ 
        file_name: '', 
        file_path: '', 
        file_format: '', 
        file_size: 0,
        acquisition_date: new Date().toISOString().split('T')[0],
        description: ''
      }]);
      setExistingResult(null);
    }
  }, [resetForm, testResult]);

  const loadTestOrders = async (search: string) => {
    try {
      const response = await diagnosticService.getTestOrders({ search, per_page: 50 });
      const options = response.data.map((order: any) => ({
        value: order.id.toString(),
        label: `${order.test_order_number} - ${order.patient_name}`
      }));
      setTestOrderOptions(options);
      return options;
    } catch (error) {
      console.error('Error loading test orders:', error);
      return [];
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validDetails = details.filter(d => d.parameter_name).map(({ testName, ...rest }) => rest);
    const validFiles = files.filter(f => f.file_name);
    
    const submitData = {
      ...(existingResult && { id: existingResult.id }),
      result_number: formData.result_number,
      test_order_id: parseInt(formData.test_order_id.toString()),
      result_date: formData.result_date,
      overall_report: formData.overall_report,
      performed_by: formData.performed_by,
      result_type: formData.result_type,
      notes: formData.notes,
      doctor_id: formData.doctor_id ? parseInt(formData.doctor_id.toString()) : null,
      license_number: formData.license_number,
      details: validDetails,
      files: validFiles
    };
    onSave(submitData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calculateVerdict = (paramValue: string, refValue: string): string => {
    if (!paramValue || !refValue) return '';
    
    const value = parseFloat(paramValue);
    if (isNaN(value)) return '';
    
    // Check for < or > operators
    if (refValue.startsWith('<')) {
      const threshold = parseFloat(refValue.substring(1));
      return value < threshold ? 'Normal' : 'High';
    }
    if (refValue.startsWith('>')) {
      const threshold = parseFloat(refValue.substring(1));
      return value > threshold ? 'Normal' : 'Low';
    }
    
    // Check for range (e.g., "10-20" or "10 - 20")
    const rangeMatch = refValue.match(/([\d.]+)\s*-\s*([\d.]+)/);
    if (rangeMatch) {
      const min = parseFloat(rangeMatch[1]);
      const max = parseFloat(rangeMatch[2]);
      if (value < min) return 'Low';
      if (value > max) return 'High';
      return 'Normal';
    }
    
    return '';
  };

  const handleDetailChange = (index: number, field: string, value: string) => {
    setDetails(prev => prev.map((item, i) => {
      if (i !== index) return item;
      
      const updated = { ...item, [field]: value };
      
      // Auto-calculate verdict when parameter_value changes
      if (field === 'parameter_value') {
        updated.verdict = calculateVerdict(value, item.reference_value);
      }
      
      return updated;
    }));
  };

  const addDetail = () => {
    setDetails(prev => [...prev, { 
      parameter_id: '', 
      parameter_name: '', 
      unit: '',
      parameter_value: '', 
      reference_value: '', 
      verdict: '',
      notes: '',
      testName: ''
    }]);
  };

  const removeDetail = (index: number) => {
    setDetails(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileChange = (index: number, field: string, value: string) => {
    setFiles(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const handleFileUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFiles(prev => prev.map((item, i) => 
        i === index ? {
          ...item,
          file_name: file.name,
          file_path: URL.createObjectURL(file),
          file_format: file.name.split('.').pop() || '',
          file_size: file.size
        } : item
      ));
    }
  };

  const addFile = () => {
    setFiles(prev => [...prev, { 
      file_name: '', 
      file_path: '', 
      file_format: '', 
      file_size: 0,
      acquisition_date: new Date().toISOString().split('T')[0],
      description: ''
    }]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const showParametricSection = ['Parametric', 'Both'].includes(formData.result_type);
  const showFileSection = ['Image', 'Video', 'Both'].includes(formData.result_type);

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          {testResult ? 'Edit Test Result' : 'Create New Test Result'}
        </h2>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="text-gray-500 hover:text-gray-700"
        >
          {isCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
        </button>
      </div>
      
      {!isCollapsed && (
        <form onSubmit={handleSubmit} className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                TR Number
              </label>
              <input
                type="text"
                name="result_number"
                value={formData.result_number}
                readOnly
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-50 focus:outline-none font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Test Order *
              </label>
              <SearchableDropdown
                options={testOrderOptions}
                value={formData.test_order_id.toString()}
                onChange={async (value) => {
                  if (!value) {
                    setFormData({
                      result_number: generateTRNumber(),
                      test_order_id: '',
                      result_date: new Date().toISOString().split('T')[0],
                      overall_report: '',
                      performed_by: '',
                      result_type: 'Parametric',
                      notes: '',
                      doctor_id: '',
                      license_number: ''
                    });
                    setDetails([{ 
                      parameter_id: '', 
                      parameter_name: '', 
                      unit: '',
                      parameter_value: '', 
                      reference_value: '', 
                      verdict: '',
                      notes: ''
                    }]);
                    setFiles([{ 
                      file_name: '', 
                      file_path: '', 
                      file_format: '', 
                      file_size: 0,
                      acquisition_date: new Date().toISOString().split('T')[0],
                      description: ''
                    }]);
                    setExistingResult(null);
                    return;
                  }

                  try {
                    const orderResponse = await diagnosticService.getTestOrder(parseInt(value as string));
                    const order = orderResponse.data;
                    
                    const params: {value: string, label: string, data: any}[] = [];
                    const paramsByTest: {[testName: string]: any[]} = {};
                    if (order.items) {
                      for (const item of order.items) {
                        if (item.test_id) {
                          const testResponse = await diagnosticService.getTest(item.test_id);
                          const test = testResponse.data;
                          if (test.parameters) {
                            paramsByTest[test.name] = test.parameters.map((param: any) => ({
                              ...param,
                              testName: test.name
                            }));
                            test.parameters.forEach((param: any) => {
                              params.push({
                                value: param.id.toString(),
                                label: `${param.name} (${param.unit || ''})`,
                                data: { ...param, testName: test.name }
                              });
                            });
                          }
                        }
                      }
                    }
                    setParameterOptions(params);
                    setParametersByTest(paramsByTest);
                    
                    const response = await diagnosticService.getTestResultByOrderId(parseInt(value as string));
                    const results = response.data;
                    
                    if (results && results.length > 0) {
                      const result = results[0];
                      const fullResultResponse = await diagnosticService.getTestResult(result.id);
                      const fullResult = fullResultResponse.data;
                      
                      if (fullResult.doctor_id) {
                        try {
                          const doctorResponse = await clinicService.getDoctor(fullResult.doctor_id);
                          const doctor = doctorResponse.data;
                          const doctorOption = {
                            value: doctor.id.toString(),
                            label: `${doctor.first_name || ''} ${doctor.last_name || ''} | ${doctor.specialization || 'NA'}`
                          };
                          setDoctorOptions(prev => {
                            const exists = prev.find(d => d.value === doctorOption.value);
                            return exists ? prev : [...prev, doctorOption];
                          });
                        } catch (error) {
                          console.error('Error loading doctor:', error);
                        }
                      }
                      
                      setFormData({
                        result_number: fullResult.result_number,
                        test_order_id: value as string,
                        result_date: fullResult.result_date,
                        overall_report: fullResult.overall_report || '',
                        performed_by: fullResult.performed_by || '',
                        result_type: fullResult.result_type || 'Parametric',
                        notes: fullResult.notes || '',
                        doctor_id: fullResult.doctor_id ? fullResult.doctor_id.toString() : '',
                        license_number: fullResult.license_number || ''
                      });
                      setDetails(fullResult.details || []);
                      setFiles(fullResult.files || []);
                      setExistingResult(fullResult);
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        result_number: generateTRNumber(),
                        test_order_id: value as string,
                        doctor_id: '',
                        performed_by: '',
                        license_number: ''
                      }));
                      
                      const initialDetails = params.length > 0 ? params.map(p => ({
                        parameter_id: p.value,
                        parameter_name: p.data?.name || p.label.split(' (')[0],
                        unit: p.data?.unit || '',
                        parameter_value: '',
                        reference_value: p.data?.normal_range || '',
                        verdict: '',
                        notes: '',
                        testName: p.data?.testName || ''
                      })) : [{ 
                        parameter_id: '', 
                        parameter_name: '', 
                        unit: '',
                        parameter_value: '', 
                        reference_value: '', 
                        verdict: '',
                        notes: '',
                        testName: ''
                      }];
                      
                      setDetails(initialDetails);
                      setFiles([{ 
                        file_name: '', 
                        file_path: '', 
                        file_format: '', 
                        file_size: 0,
                        acquisition_date: new Date().toISOString().split('T')[0],
                        description: ''
                      }]);
                      setExistingResult(null);
                    }
                  } catch (error) {
                    console.log('Error loading test order data:', error);
                    setFormData(prev => ({
                      ...prev,
                      result_number: generateTRNumber(),
                      test_order_id: value as string
                    }));
                    setDetails([{ 
                      parameter_id: '', 
                      parameter_name: '', 
                      unit: '',
                      parameter_value: '', 
                      reference_value: '', 
                      verdict: '',
                      notes: ''
                    }]);
                    setFiles([{ 
                      file_name: '', 
                      file_path: '', 
                      file_format: '', 
                      file_size: 0,
                      acquisition_date: new Date().toISOString().split('T')[0],
                      description: ''
                    }]);
                    setParameterOptions([]);
                    setExistingResult(null);
                  }
                }}
                placeholder="Select Test Order"
                onSearch={loadTestOrders}
                multiple={false}
                searchable={true}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Result Date *
              </label>
              <DatePicker
                value={formData.result_date}
                onChange={(value) => setFormData(prev => ({ ...prev, result_date: value }))}
                required
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Result Type *
              </label>
              <SearchableDropdown
                options={[
                  { value: 'Parametric', label: 'Parametric' },
                  { value: 'Image', label: 'Image' },
                  { value: 'Video', label: 'Video' },
                  { value: 'Both', label: 'Both' },
                  { value: 'Text', label: 'Text' },
                  { value: 'Others', label: 'Others' }
                ]}
                value={formData.result_type}
                onChange={(value) => setFormData(prev => ({ ...prev, result_type: value as string }))}
                placeholder="Select Result Type"
                multiple={false}
                searchable={true}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Overall Report
              </label>
              <input
                type="text"
                name="overall_report"
                value={formData.overall_report}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Doctor
              </label>
              <SearchableDropdown
                options={doctorOptions}
                value={formData.doctor_id ? formData.doctor_id.toString() : ''}
                onChange={async (value) => {
                  if (!value) {
                    setFormData(prev => ({ ...prev, doctor_id: '', performed_by: '', license_number: '' }));
                    return;
                  }
                  try {
                    const response = await clinicService.getDoctor(parseInt(value as string));
                    const doctor = response.data;
                    setFormData(prev => ({
                      ...prev,
                      doctor_id: value.toString(),
                      performed_by: `${doctor.first_name || ''} ${doctor.last_name || ''}`.trim(),
                      license_number: doctor.license_number || ''
                    }));
                  } catch (error) {
                    console.error('Error loading doctor:', error);
                  }
                }}
                onSearch={loadDoctors}
                placeholder="Select Doctor"
                multiple={false}
                searchable={true}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Performed By
              </label>
              <input
                type="text"
                name="performed_by"
                value={formData.performed_by}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Doctor License
              </label>
              <input
                type="text"
                name="license_number"
                value={formData.license_number}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Notes
              </label>
              <input
                type="text"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-gray-800">Parameter Details</h3>
              <button
                type="button"
                onClick={addDetail}
                className="flex items-center px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Parameter
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="border border-gray-200" style={{ minWidth: '800px', width: '100%' }}>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-left">Parameter ID</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-left">Parameter Name *</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-left">Unit</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-left">Value</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-left">Reference</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-left">Verdict</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-left">Notes</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const grouped: {[testName: string]: any[]} = {};
                    details.forEach((detail, index) => {
                      const testName = detail.testName || 'Other';
                      if (!grouped[testName]) grouped[testName] = [];
                      grouped[testName].push({ ...detail, originalIndex: index });
                    });
                    
                    return Object.entries(grouped).map(([testName, testDetails]) => (
                      <React.Fragment key={testName}>
                        <tr className="bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-150 cursor-pointer" onClick={() => setCollapsedTests(prev => ({ ...prev, [testName]: !prev[testName] }))}>
                          <td colSpan={8} className="px-3 py-2">
                            <div className="flex items-center space-x-2">
                              {collapsedTests[testName] ? <ChevronDown className="h-4 w-4 text-blue-700" /> : <ChevronUp className="h-4 w-4 text-blue-700" />}
                              <span className="text-sm font-semibold text-blue-900">{testName}</span>
                              <span className="text-xs text-blue-600">({testDetails.length} parameters)</span>
                            </div>
                          </td>
                        </tr>
                        {!collapsedTests[testName] && testDetails.map((detail) => (
                          <tr key={detail.originalIndex} className="border-t hover:bg-gray-50">
                            <td className="px-2 py-2">
                              <div className="pointer-events-none">
                                <SearchableDropdown
                                  options={parameterOptions}
                                  value={detail.parameter_id}
                                  onChange={() => {}}
                                  placeholder="Select Parameter"
                                  multiple={false}
                                  searchable={false}
                                  className="w-full bg-gray-50"
                                />
                              </div>
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="text"
                                value={detail.parameter_name}
                                readOnly
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-50 focus:outline-none"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="text"
                                value={detail.unit || ''}
                                readOnly
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-50 focus:outline-none"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="text"
                                value={detail.parameter_value}
                                onChange={(e) => handleDetailChange(detail.originalIndex, 'parameter_value', e.target.value)}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="text"
                                value={detail.reference_value}
                                readOnly
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-50 focus:outline-none"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="text"
                                value={detail.verdict}
                                readOnly
                                placeholder="Normal/Abnormal"
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-50 focus:outline-none"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="text"
                                value={detail.notes || ''}
                                onChange={(e) => handleDetailChange(detail.originalIndex, 'notes', e.target.value)}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            </td>
                            <td className="px-2 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => removeDetail(detail.originalIndex)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-gray-800">Image Details</h3>
              <button
                type="button"
                onClick={addFile}
                className="flex items-center px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Image
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="border border-gray-200" style={{ minWidth: '800px', width: '100%' }}>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-left">Upload File *</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-left">File Name</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-left">Format</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-left">Size (bytes)</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-left">Acquisition Date</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-left">Description</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-2 py-2">
                        <input
                          type="file"
                          onChange={(e) => handleFileUpload(index, e)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={file.file_name}
                          readOnly
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-50 focus:outline-none"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={file.file_format}
                          readOnly
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-50 focus:outline-none"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          value={file.file_size}
                          readOnly
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-50 focus:outline-none"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <DatePicker
                          value={file.acquisition_date}
                          onChange={(value) => handleFileChange(index, 'acquisition_date', value)}
                          className="w-full"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={file.description}
                          onChange={(e) => handleFileChange(index, 'description', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 mt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-secondary rounded"
            >
              {existingResult ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default TestResultForm;
