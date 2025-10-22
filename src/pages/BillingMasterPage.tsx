import React from 'react';
import BillingMasterManagement from '../components/clinic/BillingMasterManagement';

const BillingMasterPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="py-6">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Clinic Billing Master</h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage billing master data for clinic services and charges
              </p>
            </div>
            <BillingMasterManagement />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingMasterPage;