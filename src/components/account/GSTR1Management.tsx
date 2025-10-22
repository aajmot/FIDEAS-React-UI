import React from 'react';
import { FileSpreadsheet } from 'lucide-react';

const GSTR1Management: React.FC = () => {
  return (
    <div className="p-3 sm:p-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <FileSpreadsheet size={48} className="mx-auto mb-4 text-blue-600" />
          <h1 className="text-2xl font-bold mb-2">GSTR-1 Returns</h1>
          <p className="text-gray-600 mb-4">Generate and file GSTR-1 returns</p>
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-sm text-yellow-800">
            This feature is under development. GSTR-1 filing will be available soon.
          </div>
        </div>
      </div>
    </div>
  );
};

export default GSTR1Management;
