import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import logger from './logger';
/**
 * A generic POST wrapper
 * T = The shape of the data returned by the API
 * D = The shape of the data being sent (payload)
 */
export const whatsappApiPost = async <T, D = any>(
  url: string,
  data: D,
  config?: AxiosRequestConfig
): Promise<T> => {
  try {
    const response: AxiosResponse<T> = await axios.post(url, data, {
      ...config,
      headers: {
        Authorization: `Bearer ${process.env.GRAPH_API_TOKEN}`,
        'Content-Type': 'application/json',
        ...config?.headers,
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      logger.error(`API Error: ${error.response?.status} - ${error.message}`);
      logger.error(`Error Details: ${JSON.stringify(error.response?.data)}`); // Add this line
      logger.error(`Request URL: ${url}`); // Add this line
      logger.error(`Request Payload: ${JSON.stringify(data)}`); // Add this line
    }
    throw error;
  }
};
/**
 * A generic POST wrapper
 * T = The shape of the data returned by the API
 * D = The shape of the data being sent (payload)
 */
export const dbApiPost = async <T, D = any>(
  url: string,
  data: D,
  config?: AxiosRequestConfig
): Promise<T> => {
  try {
    const response: AxiosResponse<T> = await axios.post(url, data, {
      ...config,
      headers: {
        Authorization: `Bearer ${process.env.GRAPH_API_TOKEN}`,
        'Content-Type': 'application/json',
        ...config?.headers,
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      logger.error(`API Error: ${error.response?.status} - ${error.message}`);
    }
    throw error;
  }
};
/**
 * A generic GET wrapper
 * T = The shape of the data returned by the API
 * D = The shape of the data being sent (payload)
 */
export const dbApiGet = async <T, D = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  try {
    const response: AxiosResponse<T> = await axios.get(url, {
      ...config,
      headers: {
        Authorization: `Bearer ${process.env.GRAPH_API_TOKEN}`,
        'Content-Type': 'application/json',
        ...config?.headers,
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      logger.error(`API Error: ${error.response?.status} - ${error.message}`);
    }
    throw error;
  }
};
