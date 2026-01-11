import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Download, AlertCircle } from 'lucide-react';
import { publicApiService } from '../../services/publicApi';
import '../../reports.css';

const PublicTestResultView: React.FC = () => {
  const { resultNo } = useParams<{ resultNo: string }>();
  const [resultDetails, setResultDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (resultNo) {
      loadTestResult(resultNo);
    } else {
      setError({
        header: 'Missing Parameter',
        message: 'Test result number is required.',
        action: 'Contact Support'
      });
      setLoading(false);
    }
  }, [resultNo]);

  const loadTestResult = async (encryptedResultNo: string) => {
    try {
      const response = await publicApiService.getTestResult(encryptedResultNo);
      setResultDetails(response.data);
    } catch (error: any) {
      setError(error.response?.data?.detail || {
        header: 'Error Loading Result',
        message: 'Unable to load test result. Please try again later.',
        action: 'Contact Support'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading test result...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-blue-600">FIDEAS Health</h1>
              </div>
              <div className="text-sm text-gray-500">
                Test Result Portal
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{error.header}</h2>
            <p className="text-gray-600 mb-4">{error.message}</p>
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              {error.action}
            </button>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-4 text-center text-sm text-gray-500">
              <p>&copy; 2024 FIDEAS Health. All rights reserved.</p>
              <p className="mt-1">For support, contact your healthcare provider.</p>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-blue-600">FIDEAS Health</h1>
            </div>
            <div className="text-sm text-gray-500">
              Test Result Portal
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="report-view bg-white">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center print:hidden bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Test Result</h2>
            <button
              onClick={handleDownload}
              className="flex items-center px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded"
            >
              <Download className="h-3 w-3 mr-1" />
              Download
            </button>
          </div>

      <div className="report-content report-container max-w-4xl mx-auto p-8">
        <div className="report-header border-b-2 border-blue-600 pb-3 mb-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="report-company-name text-3xl font-bold text-blue-600 mb-2">{resultDetails.tenant?.name || 'Healthcare Center'}</h1>
              {resultDetails.tenant?.address && (
                <div className="text-gray-600 mb-2">
                  <div className="whitespace-pre-line">{resultDetails.tenant.address}</div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              {resultDetails.result?.qr_code && (
                <img 
                  src={resultDetails.result.qr_code} 
                  alt="Test Result QR Code" 
                  className="w-12 h-12"
                />
              )}
              <div className="text-right">
                <h2 className="report-title text-2xl font-bold text-gray-800 mb-2">TEST RESULT</h2>
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
        </div>

        {(resultDetails.result?.overall_report || resultDetails.result?.notes) && (
          <div className="report-section grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {resultDetails.result.overall_report && (
              <div className="report-details bg-yellow-50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1">Overall Report</h3>
                <p className="text-sm text-gray-700">{resultDetails.result.overall_report}</p>
              </div>
            )}
            {resultDetails.result.notes && (
              <div className="report-details bg-yellow-50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1">Notes</h3>
                <p className="text-sm text-gray-700">{resultDetails.result.notes}</p>
              </div>
            )}
          </div>
        )}

        <div className="report-section grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="report-details bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1">Result Information</h3>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Result Number:</span>
                <span className="font-semibold text-gray-900">{resultDetails.result?.result_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Result Date:</span>
                <span className="text-gray-900">{new Date(resultDetails.result?.result_date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: '2-digit' 
                })}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Patient:</span>
                <span className="text-gray-900">{resultDetails.test_order?.patient_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Order Number:</span>
                <span className="text-gray-900">{resultDetails.test_order?.test_order_number}</span>
              </div>
            </div>
          </div>
          
          <div className="report-details bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1">Doctor Information</h3>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Name:</span>
                <span className="font-semibold text-gray-900">{resultDetails.test_order?.doctor_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Phone:</span>
                <span className="text-gray-900">{resultDetails.test_order?.doctor_phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">License:</span>
                <span className="text-gray-900">{resultDetails.test_order?.doctor_license_number || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {resultDetails.result?.details && resultDetails.result.details.length > 0 && (
          <div className="report-section mb-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1">Parameter Details</h3>
            <div className="overflow-x-auto shadow-sm border border-gray-200 rounded-lg">
              <table className="report-table w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Parameter</th>
                    <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Unit</th>
                    <th className="px-2 py-2 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Value</th>
                    <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Reference</th>
                    {/* <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Verdict</th> */}
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Notes</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {resultDetails.result.details.map((detail: any, index: number) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-2 py-2 text-sm font-medium text-gray-900 border-b">{detail.parameter_name}</td>
                      <td className="px-2 py-2 text-sm text-center text-gray-700 border-b">{detail.unit || '-'}</td>
                      <td className="px-2 py-2 text-sm text-right font-medium text-gray-900 border-b">{detail.parameter_value}</td>
                      <td className="px-2 py-2 text-sm text-center text-gray-700 border-b">{detail.reference_value}</td>
                      {/* <td className="px-2 py-2 text-sm text-center font-semibold border-b">
                        <span className={detail.verdict === 'Normal' ? 'text-green-600' : 'text-red-600'}>
                          {detail.verdict}
                        </span>
                      </td> */}
                      <td className="px-2 py-2 text-sm text-gray-700 border-b">{detail.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="report-footer border-t border-gray-200 pt-3 mt-4">
          <div className="text-right">
            <div className="text-xs text-gray-500">
              <p>This is a computer generated document.</p>
              <p>Generated on: {new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 text-center text-sm text-gray-500">
            <p>&copy; 2024 FIDEAS Health. All rights reserved.</p>
            <p className="mt-1">For support, contact your healthcare provider.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicTestResultView;