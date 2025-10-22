import React, { useState, useEffect } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import { diagnosticService, adminService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Tenant } from '../../types';
import '../inventory/PurchaseOrderPrint.css';

interface TestResultViewProps {
  result: any;
  onBack: () => void;
}

const TestResultView: React.FC<TestResultViewProps> = ({ result, onBack }) => {
  const [resultDetails, setResultDetails] = useState<any>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [testOrder, setTestOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    loadResultDetails();
  }, [result.id]);

  const loadResultDetails = async () => {
    try {
      const [resultResponse, tenantResponse] = await Promise.all([
        diagnosticService.getTestResult(result.id),
        adminService.getTenant()
      ]);
      const resultData = resultResponse.data;
      setResultDetails(resultData);
      setTenant(tenantResponse.data);
      
      if (resultData.test_order_id) {
        const orderResponse = await diagnosticService.getTestOrder(resultData.test_order_id);
        const order = orderResponse.data;
        
        const parameterTestMap: {[parameterId: string]: string} = {};
        if (order.items) {
          for (const item of order.items) {
            if (item.test_id) {
              const testResponse = await diagnosticService.getTest(item.test_id);
              const test = testResponse.data;
              if (test.parameters) {
                test.parameters.forEach((param: any) => {
                  parameterTestMap[param.id] = test.name;
                });
              }
            }
          }
        }
        
        const detailsWithTest = resultData.details?.map((detail: any) => ({
          ...detail,
          testName: parameterTestMap[detail.parameter_id] || 'Other'
        }));
        
        setResultDetails({ ...resultData, details: detailsWithTest });
        setTestOrder(order);
      }
    } catch (error) {
      showToast('error', 'Failed to load result details');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = document.querySelector('.test-result-content');
    const originalContent = document.body.innerHTML;
    
    if (printContent) {
      document.body.innerHTML = printContent.innerHTML;
      window.print();
      document.body.innerHTML = originalContent;
      window.location.reload();
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center">
        <div className="text-gray-500">Loading result details...</div>
      </div>
    );
  }

  if (!resultDetails) {
    return (
      <div className="p-6">
        <div className="text-red-500">Result not found</div>
        <button onClick={onBack} className="mt-4 text-blue-600 hover:text-blue-800">
          ← Back to Results
        </button>
      </div>
    );
  }

  return (
    <div className="purchase-order-view bg-white min-h-screen">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center print:hidden bg-gray-50">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </button>
          <h2 className="text-lg font-semibold text-gray-900">Test Result Details</h2>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded"
        >
          <Printer className="h-3 w-3 mr-1" />
          Print
        </button>
      </div>

      <div className="test-result-content print-container max-w-4xl mx-auto p-8 print:p-3 print:max-w-none">
        <div className="print-header border-b-2 border-blue-600 pb-3 mb-4 print:pb-2 print:mb-2">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="print-company-name text-3xl font-bold text-blue-600 mb-2">{tenant?.name || 'Company Name'}</h1>
              {tenant?.address && (
                <div className="text-gray-600 mb-2">
                  <div className="whitespace-pre-line">{tenant.address}</div>
                </div>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {tenant?.phone && <div>Phone: {tenant.phone}</div>}
                {tenant?.email && <div>Email: {tenant.email}</div>}
                {tenant?.tax_id && <div>Tax ID: {tenant.tax_id}</div>}
              </div>
            </div>
            <div className="text-right">
              <h2 className="print-po-title text-2xl font-bold text-gray-800 mb-2">TEST RESULT</h2>
              <div className="text-sm text-gray-600">
                <div>Date: {new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="print-section grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 print:gap-2 print:mb-2">
          <div className="print-order-details bg-gray-50 p-4 rounded-lg print:p-2">
            <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1 print:text-xs print:mb-1">Result Information</h3>
            <div className="space-y-1 print:space-y-0">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Result Number:</span>
                <span className="font-semibold text-gray-900">{resultDetails.result_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Result Date:</span>
                <span className="text-gray-900">{new Date(resultDetails.result_date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: '2-digit' 
                })}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Result Type:</span>
                <span className="text-gray-900">{resultDetails.result_type}</span>
              </div>
            </div>
          </div>
          
          <div className="print-order-details bg-blue-50 p-4 rounded-lg print:p-2">
            <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1 print:text-xs print:mb-1">Performed By</h3>
            <div className="space-y-1 print:space-y-0">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Name:</span>
                <span className="font-semibold text-gray-900">{resultDetails.performed_by || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">License:</span>
                <span className="text-gray-900">{resultDetails.license_number || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {(resultDetails.overall_report || resultDetails.notes) && (
          <div className="print-section grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 print:gap-2 print:mb-2">
            {resultDetails.overall_report && (
              <div className="print-order-details bg-yellow-50 p-4 rounded-lg print:p-2">
                <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1 print:text-xs print:mb-1">Overall Report</h3>
                <p className="text-sm text-gray-700">{resultDetails.overall_report}</p>
              </div>
            )}
            {resultDetails.notes && (
              <div className="print-order-details bg-yellow-50 p-4 rounded-lg print:p-2">
                <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1 print:text-xs print:mb-1">Notes</h3>
                <p className="text-sm text-gray-700">{resultDetails.notes}</p>
              </div>
            )}
          </div>
        )}

        {resultDetails.details && resultDetails.details.length > 0 && (
          <div className="print-section mb-4 print:mb-2">
            <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1 print:text-xs print:mb-1">Parameter Details</h3>
            <div className="overflow-x-auto shadow-sm border border-gray-200 rounded-lg print:overflow-visible">
              <table className="print-table w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Parameter Name</th>
                    <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Unit</th>
                    <th className="px-2 py-2 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Value</th>
                    <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Reference</th>
                    <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Verdict</th>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Notes</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(() => {
                    const grouped: {[testName: string]: any[]} = {};
                    resultDetails.details.forEach((detail: any) => {
                      const testName = detail.testName || 'Other';
                      if (!grouped[testName]) grouped[testName] = [];
                      grouped[testName].push(detail);
                    });
                    
                    return Object.entries(grouped).map(([testName, testDetails]) => (
                      <React.Fragment key={testName}>
                        <tr className="bg-blue-100">
                          <td colSpan={6} className="px-3 py-2 text-sm font-bold text-blue-900 border-b">
                            {testName}
                          </td>
                        </tr>
                        {testDetails.map((detail: any, index: number) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-2 py-2 text-sm font-medium text-gray-900 border-b">{detail.parameter_name}</td>
                            <td className="px-2 py-2 text-sm text-center text-gray-700 border-b">{detail.unit || '-'}</td>
                            <td className="px-2 py-2 text-sm text-right font-medium text-gray-900 border-b">{detail.parameter_value}</td>
                            <td className="px-2 py-2 text-sm text-center text-gray-700 border-b">{detail.reference_value}</td>
                            <td className="px-2 py-2 text-sm text-center font-semibold border-b">
                              <span className={detail.verdict === 'Normal' ? 'text-green-600' : 'text-red-600'}>
                                {detail.verdict}
                              </span>
                            </td>
                            <td className="px-2 py-2 text-sm text-gray-700 border-b">{detail.notes || '-'}</td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {resultDetails.files && resultDetails.files.length > 0 && (
          <div className="print-section mb-4 print:mb-2">
            <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1 print:text-xs print:mb-1">Image Details</h3>
            <div className="overflow-x-auto shadow-sm border border-gray-200 rounded-lg print:overflow-visible">
              <table className="print-table w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">File Name</th>
                    <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Format</th>
                    <th className="px-2 py-2 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Size (bytes)</th>
                    <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Acquisition Date</th>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Description</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {resultDetails.files.map((file: any, index: number) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-2 py-2 text-sm font-medium text-gray-900 border-b">{file.file_name}</td>
                      <td className="px-2 py-2 text-sm text-center text-gray-700 border-b">{file.file_format}</td>
                      <td className="px-2 py-2 text-sm text-right text-gray-700 border-b">{file.file_size}</td>
                      <td className="px-2 py-2 text-sm text-center text-gray-700 border-b">{new Date(file.acquisition_date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: '2-digit' 
                      })}</td>
                      <td className="px-2 py-2 text-sm text-gray-700 border-b">{file.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="print-footer border-t border-gray-200 pt-3 mt-4 print:pt-2 print:mt-2">
          <div className="text-right">
            <div className="print-signature-space mb-8 print:mb-4">
              <p className="text-xs text-gray-600 mb-1 print:text-xs">Authorized Signature</p>
              <div className="border-b border-gray-300 w-32 ml-auto print:w-24"></div>
            </div>
            <div className="text-xs text-gray-500 print:text-xs">
              <p>This is a computer generated document.</p>
              <p>Generated on: {new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestResultView;
