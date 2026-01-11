import apiClient from '../../apiClient';
import { BaseResponse, PaginatedResponse } from '../../../types';

export const appointmentService = {
  getAppointments: async (params?: {
    page?: number; 
    per_page?: number;
    search?: string;

    medical_record_generated?: boolean;
    prescription_generated?: boolean;
    appointment_invoice_generated?: boolean;
    test_order_generated?: boolean
  }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);

    if (params?.medical_record_generated!=undefined) queryParams.append('medical_record_generated', params.medical_record_generated.toString());
    if (params?.prescription_generated!=undefined) queryParams.append('prescription_generated', params.prescription_generated.toString());
    if (params?.appointment_invoice_generated!=undefined) queryParams.append('appointment_invoice_generated', params.appointment_invoice_generated.toString());
    if (params?.test_order_generated!=undefined) queryParams.append('test_order_generated', params.test_order_generated.toString());


    const response = await apiClient.get<PaginatedResponse>(`/api/v1/health/appointments?${queryParams.toString()}`);
    return response.data;
  },

  createAppointment: async (appointmentData: any): Promise<BaseResponse> => {
    const response = await apiClient.post<BaseResponse>('/api/v1/health/appointments', appointmentData);
    return response.data;
  },

  getAppointment: async (id: number): Promise<BaseResponse> => {
    const response = await apiClient.get<BaseResponse>(`/api/v1/health/appointments/${id}`);
    return response.data;
  },

  updateAppointment: async (id: number, appointmentData: any): Promise<BaseResponse> => {
    const response = await apiClient.put<BaseResponse>(`/api/v1/health/appointments/${id}`, appointmentData);
    return response.data;
  },

  deleteAppointment: async (id: number): Promise<BaseResponse> => {
    const response = await apiClient.delete<BaseResponse>(`/api/v1/health/appointments/${id}`);
    return response.data;
  },
};
