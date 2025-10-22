import React from 'react';
import { Clock } from 'lucide-react';

const ScheduledReports: React.FC = () => {
  return (
    <div className="p-3 sm:p-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <Clock size={48} className="mx-auto mb-4 text-blue-600" />
          <h1 className="text-2xl font-bold mb-2">Scheduled Reports</h1>
          <p className="text-gray-600 mb-4">Schedule automatic report generation and delivery</p>
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-sm text-yellow-800">
            This feature is under development. Report scheduling will be available soon.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduledReports;
