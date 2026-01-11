import axios from 'axios';

const publicApiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  timeout: 30000,
});

export const publicApiService = {
  getTestResult: async (encryptedResultNo: string) => {
    const response = await publicApiClient.get(`/api/public/v1/health/test-results/${encryptedResultNo}`);
    return response.data;
  }
};