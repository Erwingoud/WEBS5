import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import CircuitBreaker from "opossum";

async function makeRequest(config: AxiosRequestConfig): Promise<unknown> {
  const response = await axios(config);
  return response.data;
}

function errorFilter(error: Error): boolean {
  if (error instanceof AxiosError) {
    const status = error.response?.status;

    if (status && status >= 400 && status < 500) {
      return true;
    }
  }

  return false;
}

export const authBreaker = new CircuitBreaker(makeRequest, {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
  errorFilter,
});

export const targetBreaker = new CircuitBreaker(makeRequest, {
  timeout: 15000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
  errorFilter,
});

export function getErrorStatus(error: unknown): number {
  if (error instanceof AxiosError) {
    return error.response?.status ?? 500;
  }

  return 500;
}

export function getErrorBody(error: unknown): unknown {
  if (error instanceof AxiosError) {
    return error.response?.data ?? { error: "Internal Gateway Error" };
  }

  return { error: "Internal Gateway Error" };
}
