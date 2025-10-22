import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import SearchableDropdown from '../common/SearchableDropdown';
import { adminService } from '../../services/api';

interface RoleUserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (roleId: number, userIds: number[]) => void;
  role: {
    role_id: number;
    role_name: string;
    users: { user_id: number; username: string }[];
  } | null;
}

const RoleUserEditModal: React.FC<RoleUserEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  role
}) => {
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      if (role) {
        setSelectedUserIds(role.users.map(u => u.user_id));
      }
    }
  }, [isOpen, role]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminService.getUsers();
      setAllUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (role) {
      onSave(role.role_id, selectedUserIds);
    }
  };

  const handleUserChange = (value: string | number | (string | number)[]) => {
    const userIds = Array.isArray(value) ? value.map(v => Number(v)) : [Number(value)];
    setSelectedUserIds(userIds);
  };

  if (!isOpen || !role) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Edit Users for {role.role_name}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Users
          </label>
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : (
            <SearchableDropdown
              options={allUsers.map(user => ({
                value: user.id,
                label: `${user.username} - ${user.first_name} ${user.last_name}`
              }))}
              value={selectedUserIds}
              onChange={handleUserChange}
              placeholder="Select users..."
              multiple={true}
              searchable={true}
              className="w-full"
            />
          )}
        </div>
        
        <div className="flex justify-end space-x-2 p-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-secondary rounded"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleUserEditModal;