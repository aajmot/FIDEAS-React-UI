import React, { useState } from 'react';
import { FileText, Download } from 'lucide-react';
import SearchableDropdown from '../common/SearchableDropdown';
import { useToast } from '../../context/ToastContext';
import { reportService } from '../../services';

const GSTReports: React.FC = () => {
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const { showToast } = useToast();

  const generateGSTR1 = async () => {
    setLoading(true);
    try {
      const response = await reportService.getGSTR1(month, year);
      setReportData({ type: 'GSTR1', data: response.data });
      showToast('success', 'GSTR-1 generated successfully');
    } catch (error: any) {
      showToast('error', error.message || 'Failed to generate GSTR-1');
    } finally {
      setLoading(false);
    }
  };

  const generateGSTR3B = async () => {
    setLoading(true);
    try {
      const response = await reportService.getGSTR3B(month, year);
      setReportData({ type: 'GSTR3B', data: response.data });
      showToast('success', 'GSTR-3B generated successfully');
    } catch (error: any) {
      showToast('error', error.message || 'Failed to generate GSTR-3B');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3 sm:p-6">
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Month</label>
            <SearchableDropdown
              options={Array.from({ length: 12 }, (_, i) => ({
                value: i + 1,
                label: new Date(2000, i).toLocaleString('default', { month: 'long' })
              }))}
              value={month}
              onChange={(value) => setMonth(value as number)}
              placeholder="Select month..."
              multiple={false}
              searchable={true}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Year</label>
            <SearchableDropdown
              options={Array.from({ length: 10 }, (_, i) => ({
                value: currentDate.getFullYear() - i,
                label: String(currentDate.getFullYear() - i)
              }))}
              value={year}
              onChange={(value) => setYear(value as number)}
              placeholder="Select year..."
              multiple={false}
              searchable={true}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">GSTR-1</h3>
          <p className="text-sm text-gray-600 mb-4">Outward supplies report</p>
          <button
            onClick={generateGSTR1}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            <FileText className="h-4 w-4 mr-2" />
            Generate GSTR-1
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">GSTR-3B</h3>
          <p className="text-sm text-gray-600 mb-4">Monthly summary return</p>
          <button
            onClick={generateGSTR3B}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            <FileText className="h-4 w-4 mr-2" />
            Generate GSTR-3B
          </button>
        </div>
      </div>

      {reportData && (
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">{reportData.type}</h2>
          <pre className="bg-gray-50 p-4 rounded overflow-auto">
            {JSON.stringify(reportData.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default GSTReports;
