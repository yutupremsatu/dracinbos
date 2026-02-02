import { decryptData } from "@/lib/crypto";

export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = "ApiError";
  }
}

export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }

    // Throw error with status to be caught by React Query
    throw new ApiError(
      errorData?.error || errorData?.message || "An error occurred",
      response.status,
      errorData
    );
  }

  const json = await response.json();
  let data = json;
  if (json.data && typeof json.data === "string") {
    data = decryptData(json.data);
  }

  // Strict Screening for Lists
  if (Array.isArray(data)) {
    // @ts-ignore
    return data.filter(item => {
      const isValid = item.title && item.cover_url && item.platform_id;
      const isNotDefault = item.cover_url !== 'undefined' && item.cover_url !== '';
      return isValid && isNotDefault;
    }) as T;
  }

  return data as T;
}
