"use client";

// Users section component
import React, { useState, useCallback } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { StatusBadge } from '../../common/StatusBadge';
import AddUserModal from '../../shared/AddUserModal';

export const UsersSection: React.FC = () => {
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState<any>(null);

  const getUsers = useCallback(() => apiService.users.getUsers(), []);
  const { data: users, loading, refetch } = useApi(getUsers);

  const handleUserAdded = () => {
    refetch();
  };

  const handleEditUser = (user: any) => {
    setUserToEdit(user);
    setShowAddUserModal(true);
  };

  const handleCloseUserModal = () => {
    setShowAddUserModal(false);
    setUserToEdit(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-800">User Management</h3>
        <button
          onClick={() => setShowAddUserModal(true)}
          className="w-full sm:w-auto bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center justify-center text-sm sm:text-base"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </button>
      </div>
      <div className="p-4 sm:p-6">
        {users?.length === 0 ? (
          <p className="text-sm sm:text-base text-gray-600">No users found.</p>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full min-w-[640px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users?.map((user: any) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                      {user.username}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                      {user.full_name}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 capitalize">
                      {user.role.replace('_', ' ')}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={user.is_active ? 'active' : 'inactive'} />
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-blue-600 hover:text-blue-900 mr-2 inline-flex items-center"
                      >
                        <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit User Modal */}
      <AddUserModal
        isOpen={showAddUserModal}
        onClose={handleCloseUserModal}
        onUserAdded={handleUserAdded}
        userToEdit={userToEdit}
      />
    </div>
  );
};
