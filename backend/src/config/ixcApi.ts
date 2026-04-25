import axios from 'axios';
import https from 'https';

const ixcApi = axios.create({
  httpsAgent: new https.Agent({ rejectUnauthorized: false }),
});

// Auth calculado em tempo de requisição para garantir que o .env já foi carregado
ixcApi.interceptors.request.use((config) => {
  const token = process.env.IXC_TOKEN ?? '';
  config.baseURL = process.env.IXC_HOST;
  config.headers['Content-Type'] = 'application/json';
  config.headers['Authorization'] = 'Basic ' + Buffer.from(token).toString('base64');
  return config;
});

export default ixcApi;
