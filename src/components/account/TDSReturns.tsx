import React from 'react';
import { Calculator } from 'lucide-react';

const TDSReturns: React.FC = () => {
  return (
    <div className="p-3 sm:p-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <Calculator size={48} className="mx-auto mb-4 text-blue-600" />
          <h1 className="text-2xl font-bold mb-2">TDS Returns</h1>
          <p className="text-gray-600 mb-4">Manage and file TDS returns</p>
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-sm text-yellow-800">
            This feature is under development. TDS return filing will be available soon.
          </div>
        </div>
      </div>
    </div>
  );
};

export default TDSReturns;
