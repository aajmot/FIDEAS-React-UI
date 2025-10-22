import React from 'react';
import ConfirmationModal from './ConfirmationModal';
import { useConfirmation } from '../../hooks/useConfirmation';

const ConfirmationModalExample: React.FC = () => {
  const { confirmationState, showConfirmation, hideConfirmation, handleConfirm } = useConfirmation();

  const handleDeleteUser = () => {
    showConfirmation(
      {
        title: 'Delete User',
        message: 'Are you sure you want to delete this user? This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        variant: 'danger'
      },
      () => {
        console.log('User deleted');
        // Actual delete logic here
      }
    );
  };

  const handleLogout = () => {
    showConfirmation(
      {
        title: 'Logout',
        message: 'Are you sure you want to logout? Any unsaved changes will be lost.',
        confirmText: 'Logout',
        cancelText: 'Stay',
        variant: 'warning'
      },
      () => {
        console.log('User logged out');
        // Actual logout logic here
      }
    );
  };

  const handleSaveChanges = () => {
    showConfirmation(
      {
        title: 'Save Changes',
        message: 'Do you want to save your changes before continuing?',
        confirmText: 'Save',
        cancelText: 'Discard',
        variant: 'info'
      },
      () => {
        console.log('Changes saved');
        // Actual save logic here
      }
    );
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">Confirmation Modal Examples</h2>
      
      <div className="space-x-4">
        <button
          onClick={handleDeleteUser}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Delete User (Danger)
        </button>
        
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
        >
          Logout (Warning)
        </button>
        
        <button
          onClick={handleSaveChanges}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save Changes (Info)
        </button>
      </div>

      <ConfirmationModal
        isOpen={confirmationState.isOpen}
        title={confirmationState.title}
        message={confirmationState.message}
        confirmText={confirmationState.confirmText}
        cancelText={confirmationState.cancelText}
        variant={confirmationState.variant}
        onConfirm={handleConfirm}
        onCancel={hideConfirmation}
      />
    </div>
  );
};

export default ConfirmationModalExample;