import React from 'react';
import { BarChart3 } from 'lucide-react';

const CustomReports: React.FC = () => {
  return (
    <div className="p-3 sm:p-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <BarChart3 size={48} className="mx-auto mb-4 text-blue-600" />
          <h1 className="text-2xl font-bold mb-2">Custom Reports</h1>
          <p className="text-gray-600 mb-4">Create and manage custom financial reports</p>
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-sm text-yellow-800">
            This feature is under development. Custom report builder will be available soon.
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomReports;
