import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Icon, Button, Modal, Card, Badge } from '@/components/UI';
import { adminService } from '@/services/api/adminService';
import { authService } from '@/services/api/authService';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';

export const AdminStaffManagement = () => {
  const { user } = useAuth();
  const adminId = user?.role === 'ADMIN' ? user.id : undefined;
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  // Fetch staff list
  const { data: staffData, isLoading } = useQuery({
    queryKey: ['admin', 'staff', adminId, searchQuery],
    queryFn: () => adminService.getStaff(adminId!, { search: searchQuery || undefined }),
    enabled: !!adminId,
    refetchInterval: 30000,
  });

  // Create staff mutation
  const createStaffMutation = useMutation({
    mutationFn: async (staffData: { name: string; email: string; password: string }) => {
      // Step 1: Create user account via auth service
      await authService.register({
        email: staffData.email,
        password: staffData.password,
        name: staffData.name,
        role: UserRole.STAFF,
      });
      // Step 2: Create staff record via admin service
      return await adminService.createStaff(adminId!, staffData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'staff'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      setShowAddStaffModal(false);
      setFormData({ name: '', email: '', password: '' });
      alert('Staff member created successfully!');
    },
    onError: (error: any) => {
      console.error('Error creating staff:', error);
      alert(`Failed to create staff: ${error?.message || 'Please try again.'}`);
    },
  });

  const handleCreateStaff = () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      alert('Please fill in all fields');
      return;
    }

    if (formData.password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    createStaffMutation.mutate(formData);
  };

  if (isLoading && !staffData) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 flex flex-col gap-6 animate-[fadeIn_0.5s_ease-out] pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
            Staff Management
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Manage staff members in your organization
          </p>
        </div>
        <Button
          onClick={() => setShowAddStaffModal(true)}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          <Icon name="person_add" className="text-lg" />
          Create New Staff
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search staff by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
        />
      </div>

      {/* Staff List */}
      {staffData && staffData.staff.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffData.staff.map((staff) => (
            <Card key={staff.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Icon name="medical_services" className="text-2xl text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">{staff.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{staff.email}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Patients</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{staff.patientCount}</p>
                </div>
                <Badge variant="info" className="text-xs">
                  {staff.role}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Icon name="people" className="text-4xl text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">
            {searchQuery ? 'No staff found matching your search' : 'No staff members yet'}
          </p>
        </Card>
      )}

      {/* Create Staff Modal */}
      {showAddStaffModal && (
        <Modal
          isOpen={showAddStaffModal}
          onClose={() => {
            setShowAddStaffModal(false);
            setFormData({ name: '', email: '', password: '' });
          }}
          title="Create New Staff Member"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Dr. John Doe"
                className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm px-4 py-3 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. doctor@rdmhealth.com"
                className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm px-4 py-3 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Minimum 6 characters"
                className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm px-4 py-3 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleCreateStaff}
                disabled={createStaffMutation.isPending}
                className="flex-1 bg-primary hover:bg-primary/90 text-white"
              >
                {createStaffMutation.isPending ? (
                  <>
                    <LoadingSpinner className="w-4 h-4" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Icon name="check" className="text-lg" />
                    Create Staff
                  </>
                )}
              </Button>
              <Button
                onClick={() => {
                  setShowAddStaffModal(false);
                  setFormData({ name: '', email: '', password: '' });
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

