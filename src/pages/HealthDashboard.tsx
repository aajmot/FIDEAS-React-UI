import React, { useState, useEffect } from 'react';
import { dashboardService } from '../services/api';
import { PatientAnalytics, AppointmentAnalytics, ClinicalOperations, DoctorPerformance } from '../types';
import { Activity, Users, Calendar, TrendingUp, Heart, FileText, TestTube, Clipboard } from 'lucide-react';

interface HealthDashboardState {
  patientAnalytics: PatientAnalytics | null;
  appointmentAnalytics: AppointmentAnalytics | null;
  clinicalOperations: ClinicalOperations | null;
  doctorPerformance: DoctorPerformance[];
  loading: boolean;
  error: string | null;
}

const HealthDashboard: React.FC = () => {
  const [state, setState] = useState<HealthDashboardState>({
    patientAnalytics: null,
    appointmentAnalytics: null,
    clinicalOperations: null,
    doctorPerformance: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const [patientRes, appointmentRes, clinicalRes, doctorRes] = await Promise.all([
        dashboardService.getPatientAnalytics(),
        dashboardService.getAppointmentAnalytics(),
        dashboardService.getClinicalOperations(),
        dashboardService.getDoctorPerformance()
      ]);

      setState({
        patientAnalytics: patientRes.data || null,
        appointmentAnalytics: appointmentRes.data || null,
        clinicalOperations: clinicalRes.data || null,
        doctorPerformance: doctorRes.data || [],
        loading: false,
        error: null
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load dashboard data'
      }));
    }
  };

  if (state.loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-blue-600">Loading healthcare dashboard...</div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {state.error}
        </div>
      </div>
    );
  }

  const { patientAnalytics: pa, appointmentAnalytics: aa, clinicalOperations: co } = state;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Healthcare Dashboard</h1>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Total Patients</p>
              <p className="text-xl font-bold text-gray-800">{pa?.total_patients || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">New This Month</p>
              <p className="text-xl font-bold text-gray-800">{pa?.new_patients_month || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-emerald-500">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-emerald-500" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Active Patients</p>
              <p className="text-xl font-bold text-gray-800">{pa?.active_patients || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Total Appointments</p>
              <p className="text-xl font-bold text-gray-800">{aa?.total_appointments || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-teal-500">
          <div className="flex items-center">
            <Heart className="h-8 w-8 text-teal-500" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Completion Rate</p>
              <p className="text-xl font-bold text-gray-800">{aa?.completion_rate || 0}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-500 font-bold text-sm">NS</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">No-Show Rate</p>
              <p className="text-xl font-bold text-gray-800">{aa?.no_show_rate || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Gender Distribution */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Gender Distribution</h3>
          <div className="space-y-3">
            {pa?.gender_distribution && Object.entries(pa.gender_distribution).map(([gender, count]) => {
              const total = Object.values(pa.gender_distribution).reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
              const colors = { male: 'bg-blue-500', female: 'bg-pink-500', other: 'bg-gray-500' };
              
              return (
                <div key={gender} className="flex items-center">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize text-gray-700">{gender}</span>
                      <span className="text-gray-600">{count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${colors[gender as keyof typeof colors]}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Age Groups */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Age Groups</h3>
          <div className="space-y-3">
            {pa?.age_groups && Object.entries(pa.age_groups).map(([ageGroup, count]) => {
              const total = Object.values(pa.age_groups).reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
              const labels = {
                under_18: 'Under 18',
                age_18_35: '18-35',
                age_36_55: '36-55', 
                age_56_70: '56-70',
                over_70: 'Over 70'
              };
              
              return (
                <div key={ageGroup} className="flex items-center">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{labels[ageGroup as keyof typeof labels]}</span>
                      <span className="text-gray-600">{count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-green-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Appointment Status */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Appointment Status</h3>
          <div className="space-y-3">
            {aa?.appointment_status && Object.entries(aa.appointment_status).map(([status, count]) => {
              const total = Object.values(aa.appointment_status).reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
              const colors = {
                scheduled: 'bg-blue-500',
                completed: 'bg-green-500',
                cancelled: 'bg-red-500',
                no_show: 'bg-orange-500'
              };
              
              return (
                <div key={status} className="flex items-center">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize text-gray-700">{status.replace('_', ' ')}</span>
                      <span className="text-gray-600">{count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${colors[status as keyof typeof colors]}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clinical Operations */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Clinical Operations</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">{co?.medical_records || 0}</p>
              <p className="text-sm text-gray-600">Medical Records</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Clipboard className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">{co?.prescriptions || 0}</p>
              <p className="text-sm text-gray-600">Prescriptions</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <TestTube className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">{co?.test_orders || 0}</p>
              <p className="text-sm text-gray-600">Test Orders</p>
            </div>
            <div className="text-center p-4 bg-teal-50 rounded-lg">
              <Activity className="h-8 w-8 text-teal-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-teal-600">{co?.sample_collections || 0}</p>
              <p className="text-sm text-gray-600">Sample Collections</p>
            </div>
          </div>
        </div>

        {/* Doctor Performance Table */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Top 10 Doctor Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-gray-600">Name</th>
                  <th className="text-left py-2 text-gray-600">Specialization</th>
                  <th className="text-right py-2 text-gray-600">Appointments</th>
                  <th className="text-right py-2 text-gray-600">Completion %</th>
                  <th className="text-right py-2 text-gray-600">Fee</th>
                </tr>
              </thead>
              <tbody>
                {state.doctorPerformance.length > 0 ? (
                  state.doctorPerformance.slice(0, 10).map((doctor) => (
                    <tr key={doctor.id} className="border-b border-gray-100">
                      <td className="py-2 text-gray-800">{doctor.doctor_name}</td>
                      <td className="py-2 text-gray-600">{doctor.specialization}</td>
                      <td className="py-2 text-right text-gray-800">{doctor.total_appointments}</td>
                      <td className="py-2 text-right">
                        <span className={`px-2 py-1 rounded text-xs ${
                          doctor.completion_rate >= 90 ? 'bg-green-100 text-green-800' :
                          doctor.completion_rate >= 75 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {doctor.completion_rate}%
                        </span>
                      </td>
                      <td className="py-2 text-right text-gray-800">₹{doctor.consultation_fee}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-gray-500">
                      No doctor performance data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthDashboard;