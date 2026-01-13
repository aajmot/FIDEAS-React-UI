import React, { useState, useEffect } from 'react';
import { dashboardService } from '../services/api';
import { PatientAnalytics, AppointmentAnalytics, ClinicalOperations, DoctorPerformance } from '../types/dashboard';
import { Activity, Users, Calendar, TrendingUp, Heart, FileText, TestTube, Clipboard, Clock } from 'lucide-react';

interface HealthDashboardState {
  patientAnalytics: PatientAnalytics | null;
  appointmentAnalytics: AppointmentAnalytics | null;
  clinicalOperations: ClinicalOperations | null;
  doctorPerformance: DoctorPerformance[];
  loading: boolean;
  error: string | null;
}

const Dashboard: React.FC = () => {
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
      
      // Mock data for demonstration since API might not be available
      const mockPatientAnalytics: PatientAnalytics = {
        total_patients: 1250,
        new_patients_month: 85,
        active_patients: 1180,
        gender_distribution: [
          { gender: 'Male', count: 620 },
          { gender: 'Female', count: 580 },
          { gender: 'Other', count: 50 }
        ],
        age_groups: [
          { group: 'Under 18', count: 150 },
          { group: '18-35', count: 420 },
          { group: '36-55', count: 380 },
          { group: '56-70', count: 220 },
          { group: 'Over 70', count: 80 }
        ]
      };

      const mockAppointmentAnalytics: AppointmentAnalytics = {
        total_appointments: 2340,
        scheduled: 450,
        completed: 1850,
        cancelled: 180,
        no_show: 160,
        completion_rate: 87,
        no_show_rate: 8
      };

      const mockClinicalOperations: ClinicalOperations = {
        medical_records_generated: 1850,
        prescriptions_issued: 1620,
        test_orders_created: 890,
        sample_collections: 720,
        test_results_completed: 0,
        avg_turnaround_hours: 0.0
      };

      const mockDoctorPerformance: DoctorPerformance[] = [
        { id: 1, doctor_name: 'Dr. Sarah Johnson', specialization: 'Cardiology', total_appointments: 245, completion_rate: 94, consultation_fee: 1500 },
        { id: 2, doctor_name: 'Dr. Michael Chen', specialization: 'Neurology', total_appointments: 198, completion_rate: 91, consultation_fee: 1800 },
        { id: 3, doctor_name: 'Dr. Emily Davis', specialization: 'Pediatrics', total_appointments: 312, completion_rate: 89, consultation_fee: 1200 },
        { id: 4, doctor_name: 'Dr. Robert Wilson', specialization: 'Orthopedics', total_appointments: 156, completion_rate: 87, consultation_fee: 1600 },
        { id: 5, doctor_name: 'Dr. Lisa Anderson', specialization: 'Dermatology', total_appointments: 189, completion_rate: 92, consultation_fee: 1300 }
      ];

      try {
        const [patientRes, appointmentRes, clinicalRes, doctorRes] = await Promise.all([
          dashboardService.getPatientAnalytics(),
          dashboardService.getAppointmentAnalytics(),
          dashboardService.getClinicalOperations(),
          dashboardService.getDoctorPerformance()
        ]);

        setState({
          patientAnalytics: patientRes.data || mockPatientAnalytics as any,
          appointmentAnalytics: appointmentRes.data || mockAppointmentAnalytics as any,
          clinicalOperations: clinicalRes.data || mockClinicalOperations as any,
          doctorPerformance: doctorRes.data || mockDoctorPerformance,
          loading: false,
          error: null
        });
      } catch (apiError) {
        // Use mock data if API fails
        setState({
          patientAnalytics: mockPatientAnalytics,
          appointmentAnalytics: mockAppointmentAnalytics,
          clinicalOperations: mockClinicalOperations,
          doctorPerformance: mockDoctorPerformance,
          loading: false,
          error: null
        });
      }
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
            {pa?.gender_distribution && Array.isArray(pa.gender_distribution) && pa.gender_distribution.map((item: any) => {
              const total = pa.gender_distribution.reduce((sum: number, g: any) => sum + (Number(g.count) || 0), 0);
              const numCount = Number(item.count) || 0;
              const percentage = total > 0 ? Math.round((numCount / total) * 100) : 0;
              const safePercentage = isNaN(percentage) ? 0 : percentage;
              const colors = { Male: 'bg-blue-500', Female: 'bg-pink-500', Other: 'bg-gray-500' };
              
              return (
                <div key={`gender-${item.gender}`} className="flex items-center">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{item.gender}</span>
                      <span className="text-gray-600">{numCount} ({safePercentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${colors[item.gender as keyof typeof colors] || 'bg-gray-500'}`}
                        style={{ width: `${safePercentage}%` }}
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
            {pa?.age_groups && Array.isArray(pa.age_groups) && pa.age_groups.map((item: any) => {
              const total = pa.age_groups.reduce((sum: number, g: any) => sum + (Number(g.count) || 0), 0);
              const numCount = Number(item.count) || 0;
              const percentage = total > 0 ? Math.round((numCount / total) * 100) : 0;
              const safePercentage = isNaN(percentage) ? 0 : percentage;
              
              return (
                <div key={`age-${item.group}`} className="flex items-center">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{item.group}</span>
                      <span className="text-gray-600">{numCount}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-green-500"
                        style={{ width: `${safePercentage}%` }}
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
            {aa && [
              { status: 'scheduled', count: aa.scheduled, color: 'bg-blue-500' },
              { status: 'completed', count: aa.completed, color: 'bg-green-500' },
              { status: 'cancelled', count: aa.cancelled, color: 'bg-red-500' },
              { status: 'no_show', count: aa.no_show, color: 'bg-orange-500' }
            ].map(({ status, count, color }) => {
              const total = (aa.scheduled || 0) + (aa.completed || 0) + (aa.cancelled || 0) + (aa.no_show || 0);
              const numCount = Number(count) || 0;
              const percentage = total > 0 ? Math.round((numCount / total) * 100) : 0;
              const safePercentage = isNaN(percentage) ? 0 : percentage;
              
              return (
                <div key={`status-${status}`} className="flex items-center">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize text-gray-700">{status.replace('_', ' ')}</span>
                      <span className="text-gray-600">{numCount} ({safePercentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${color}`}
                        style={{ width: `${safePercentage}%` }}
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
              <p className="text-2xl font-bold text-blue-600">{co?.medical_records_generated || 0}</p>
              <p className="text-sm text-gray-600">Medical Records</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Clipboard className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">{co?.prescriptions_issued || 0}</p>
              <p className="text-sm text-gray-600">Prescriptions</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <TestTube className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">{co?.test_orders_created || 0}</p>
              <p className="text-sm text-gray-600">Test Orders</p>
            </div>
            <div className="text-center p-4 bg-teal-50 rounded-lg">
              <Activity className="h-8 w-8 text-teal-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-teal-600">{co?.sample_collections || 0}</p>
              <p className="text-sm text-gray-600">Sample Collections</p>
            </div>
            
            <div className="text-center p-4 bg-emerald-50 rounded-lg">
              <FileText className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-emerald-600">{co?.test_results_completed || 0}</p>
              <p className="text-sm text-gray-600">Test Results Completed</p>
            </div>

            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-orange-600">{co?.avg_turnaround_hours || 0}h</p>
              <p className="text-sm text-gray-600">Avg Turnaround Time</p>
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
                  {/* <th className="text-right py-2 text-gray-600">Fee</th> */}
                </tr>
              </thead>
              <tbody>
                {state.doctorPerformance.length > 0 ? (
                  state.doctorPerformance.slice(0, 10).map((doctor, index) => (
                    <tr key={`doctor-${doctor.id || index}`} className="border-b border-gray-100">
                      <td className="py-2 text-gray-800">{doctor.doctor_name || 'N/A'}</td>
                      <td className="py-2 text-gray-600">{doctor.specialization || 'N/A'}</td>
                      <td className="py-2 text-right text-gray-800">{doctor.total_appointments || 0}</td>
                      <td className="py-2 text-right">
                        <span className={`px-2 py-1 rounded text-xs ${
                          (doctor.completion_rate || 0) >= 90 ? 'bg-green-100 text-green-800' :
                          (doctor.completion_rate || 0) >= 75 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {isNaN(doctor.completion_rate || 0) ? 0 : (doctor.completion_rate || 0)}%
                        </span>
                      </td>
                      {/* <td className="py-2 text-right text-gray-800">{doctor.consultation_fee || 0}</td> */}
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

export default Dashboard;