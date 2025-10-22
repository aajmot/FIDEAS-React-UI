import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import { ToastProvider } from '../../context/ToastContext';
import CustomerManagement from './CustomerManagement';

// Mock the API service
jest.mock('../../services/api', () => ({
  inventoryService: {
    getCustomers: jest.fn().mockResolvedValue({ data: [] }),
    createCustomer: jest.fn(),
    updateCustomer: jest.fn(),
    deleteCustomer: jest.fn(),
    downloadCustomersTemplate: jest.fn(),
    importCustomers: jest.fn(),
  }
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          {component}
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('CustomerManagement', () => {
  test('renders customer management component', () => {
    renderWithProviders(<CustomerManagement />);
    expect(screen.getByText('Customer Management')).toBeInTheDocument();
  });

  test('renders customer form', () => {
    renderWithProviders(<CustomerManagement />);
    expect(screen.getByText('Add New Customer')).toBeInTheDocument();
  });
});