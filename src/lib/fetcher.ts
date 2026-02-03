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

import { getApiBaseUrl } from "@/utils/api";

export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const fullUrl = url.startsWith("http") ? url : `${getApiBaseUrl()}${url}`;
  const response = await fetch(fullUrl, options);

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
    // @ts-ignore
    return data.filter(item => {
      // Check for either raw DB fields OR mapped API fields
      const hasTitle = item.title || item.bookName;
      const hasCover = item.cover_url || item.cover || item.coverWap;
      const hasId = item.platform_id || item.bookId;

      const isValid = hasTitle && hasCover && hasId;
      const isNotDefault = hasCover !== 'undefined' && hasCover !== '';

      return isValid && isNotDefault;
    }) as T;
  }

  return data as T;
}
