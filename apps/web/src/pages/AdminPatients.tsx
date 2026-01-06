import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Icon, Card, Badge } from '@/components/UI';
import { adminService } from '@/services/api/adminService';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { useNavigation } from '@/context/NavigationContext';
import { Page } from '@/types';

export const AdminPatients = () => {
  const { user } = useAuth();
  const adminId = user?.role === 'ADMIN' ? user.id : undefined;
  const { setCurrentPage, setNavigationState } = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'critical' | 'stable' | 'at-risk' | 'moderate' | undefined>(undefined);
  const [verificationFilter, setVerificationFilter] = useState<'pending' | 'verified' | 'rejected' | undefined>(undefined);

  // Fetch patients list
  const { data: patientsData, isLoading } = useQuery({
    queryKey: ['admin', 'patients', adminId, searchQuery, statusFilter, verificationFilter],
    queryFn: () => adminService.getPatients(adminId!, {
      search: searchQuery || undefined,
      status: statusFilter,
      verificationStatus: verificationFilter,
    }),
    enabled: !!adminId,
    refetchInterval: 30000,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'error';
      case 'at-risk':
        return 'warning';
      case 'moderate':
        return 'info';
      default:
        return 'success';
    }
  };

  const getVerificationColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      default:
        return 'success';
    }
  };

  if (isLoading && !patientsData) {
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
            All Patients
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            View all patients across your organization
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search patients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <select
          value={statusFilter || ''}
          onChange={(e) => setStatusFilter(e.target.value as any || undefined)}
          className="px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
        >
          <option value="">All Statuses</option>
          <option value="critical">Critical</option>
          <option value="at-risk">At Risk</option>
          <option value="moderate">Moderate</option>
          <option value="stable">Stable</option>
        </select>
        <select
          value={verificationFilter || ''}
          onChange={(e) => setVerificationFilter(e.target.value as any || undefined)}
          className="px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
        >
          <option value="">All Verifications</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Patients List */}
      {patientsData && patientsData.patients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {patientsData.patients.map((patient) => (
            <Card
              key={patient.id}
              className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => {
                // Could navigate to patient details page if needed
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {patient.avatar ? (
                    <img
                      src={patient.avatar}
                      alt={patient.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/20 flex items-center justify-center">
                      <Icon name="person" className="text-2xl text-teal-600 dark:text-teal-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">{patient.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{patient.patientId}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Status</span>
                  <Badge color={getStatusColor(patient.status) === 'error' ? 'red' : getStatusColor(patient.status) === 'warning' ? 'amber' : getStatusColor(patient.status) === 'info' ? 'blue' : 'green'} className="text-xs">
                    {patient.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Verification</span>
                  <Badge color={getVerificationColor(patient.verificationStatus) === 'error' ? 'red' : getVerificationColor(patient.verificationStatus) === 'warning' ? 'amber' : 'green'} className="text-xs">
                    {patient.verificationStatus}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Adherence</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {patient.adherenceScore}%
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {patient.diagnosis}
                </p>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Icon name="people" className="text-4xl text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">
            {searchQuery || statusFilter || verificationFilter
              ? 'No patients found matching your filters'
              : 'No patients yet'}
          </p>
        </Card>
      )}

      {/* Pending Verifications Alert */}
      {patientsData && patientsData.patients.filter(p => p.verificationStatus === 'pending').length > 0 && (
        <Card className="p-4 bg-amber-50 dark:bg-amber-900/10 border-2 border-amber-200 dark:border-amber-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon name="warning" className="text-amber-600 dark:text-amber-400" />
              <div>
                <p className="font-bold text-amber-900 dark:text-amber-100">
                  {patientsData.patients.filter(p => p.verificationStatus === 'pending').length} patient(s) pending verification
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Review and verify new patient registrations
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate?.(Page.A_VERIFICATIONS)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-sm transition-colors"
            >
              Review Now
            </button>
          </div>
        </Card>
      )}
    </div>
  );
};

