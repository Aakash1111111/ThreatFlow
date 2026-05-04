import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
});

client.interceptors.request.use((config) => {
  config.headers['Content-Type'] = 'application/json';
  return config;
});

client.interceptors.response.use(
  (response) => {
    if (response.config.responseType === 'blob') {
      return response.data;
    }
    return response.data;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
);

export const extractIOCs = (text) => client.post('/iocs/extract', { text });
export const submitIOCs = (iocs, sourceText) => client.post('/iocs/submit', { iocs, source_text: sourceText });
export const getIOCs = (params) => client.get('/iocs', { params });
export const deleteIOC = (id) => client.delete(`/iocs/${id}`);
export const bulkDeleteIOCs = (ids) => client.post('/iocs/bulk-delete', { ids });

export const enrichIOC = (id) => client.post(`/enrich/${id}`);
export const enrichBulk = (ids) => client.post('/enrich/bulk', { ioc_ids: ids });
export const getEnrichmentResults = (id) => client.get(`/enrich/${id}/results`);

export const getStats = () => client.get('/dashboard/stats');
export const getTimeline = () => client.get('/dashboard/timeline');

export const generateReport = async (iocIds, title) => {
  const response = await client.post('/reports/generate', 
    { ioc_ids: iocIds, title }, 
    { responseType: 'blob' }
  );
  return response;
};
