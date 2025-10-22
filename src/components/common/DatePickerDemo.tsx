import React, { useState } from 'react';
import DatePicker from './DatePicker';

const DatePickerDemo: React.FC = () => {
  const [basicDate, setBasicDate] = useState('');
  const [restrictedDate, setRestrictedDate] = useState('');
  const [prefilledDate, setPrefilledDate] = useState('2024-01-15');
  const [disabledDate, setDisabledDate] = useState('');

  // Calculate date ranges for demonstration
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Enhanced DatePicker Component</h1>
        <p className="text-gray-600">Modern date picker with month/year navigation and flexible configuration</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Basic DatePicker */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic DatePicker</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select any date
              </label>
              <DatePicker
                value={basicDate}
                onChange={setBasicDate}
                placeholder="Choose a date..."
                className="w-full"
              />
            </div>
            <div className="text-sm text-gray-600">
              Selected: {basicDate || 'None'}
            </div>
          </div>
        </div>

        {/* DatePicker with Restrictions */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Date Range Restrictions</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last 30 days only
              </label>
              <DatePicker
                value={restrictedDate}
                onChange={setRestrictedDate}
                placeholder="Select from last 30 days..."
                minDate={formatDateForInput(thirtyDaysAgo)}
                maxDate={formatDateForInput(today)}
                className="w-full"
              />
            </div>
            <div className="text-sm text-gray-600">
              Range: {formatDateForInput(thirtyDaysAgo)} to {formatDateForInput(today)}
            </div>
            <div className="text-sm text-gray-600">
              Selected: {restrictedDate || 'None'}
            </div>
          </div>
        </div>

        {/* Pre-filled DatePicker */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pre-filled Date</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default date set
              </label>
              <DatePicker
                value={prefilledDate}
                onChange={setPrefilledDate}
                placeholder="Date is pre-selected..."
                className="w-full"
              />
            </div>
            <div className="text-sm text-gray-600">
              Selected: {prefilledDate}
            </div>
          </div>
        </div>

        {/* Disabled DatePicker */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Disabled State</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Read-only date picker
              </label>
              <DatePicker
                value={disabledDate}
                onChange={setDisabledDate}
                placeholder="This is disabled..."
                disabled={true}
                className="w-full"
              />
            </div>
            <div className="text-sm text-gray-600">
              This DatePicker is disabled and cannot be interacted with.
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-gray-800">Navigation</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Click month name to select month</li>
              <li>• Click year to select year</li>
              <li>• Arrow buttons for quick navigation</li>
              <li>• Year range picker (10-year view)</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-gray-800">Functionality</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Min/Max date restrictions</li>
              <li>• Today button for quick selection</li>
              <li>• Keyboard navigation support</li>
              <li>• Click outside to close</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-gray-800">Styling</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Modern, clean design</li>
              <li>• Smooth animations</li>
              <li>• Consistent with form styling</li>
              <li>• Responsive layout</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-gray-800">States</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Selected date highlighting</li>
              <li>• Today date indication</li>
              <li>• Disabled date styling</li>
              <li>• Hover effects</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Usage Example */}
      <div className="bg-gray-50 p-6 rounded-lg border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Example</h3>
        <pre className="text-sm bg-white p-4 rounded border overflow-x-auto">
{`import DatePicker from './components/common/DatePicker';

const MyForm = () => {
  const [orderDate, setOrderDate] = useState('');
  
  return (
    <DatePicker
      value={orderDate}
      onChange={setOrderDate}
      placeholder="Select order date"
      minDate="2024-01-01"
      maxDate="2024-12-31"
      required
      className="w-full"
    />
  );
};`}
        </pre>
      </div>
    </div>
  );
};

export default DatePickerDemo;