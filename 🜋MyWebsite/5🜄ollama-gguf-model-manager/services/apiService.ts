
import { OllamaModel, UploadResponse, GenerateResponse, ApiErrorResponse } from '../types';
import { BACKEND_API_URL } from '../constants';

async function handleResponse<T,>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      // If parsing JSON fails, use status text
      throw new Error(response.statusText || `HTTP error! status: ${response.status}`);
    }
    // Ollama generate endpoint can return 200 OK with an error field.
    // This part handles non-ok responses primarily.
    const errorMessage = (errorData as ApiErrorResponse)?.error || (errorData as GenerateResponse)?.error || response.statusText || `HTTP error! status: ${response.status}`;
    throw new Error(errorMessage);
  }
  // For Ollama generate, even if response.ok, there might be an error field in the JSON.
  // This is usually handled by the caller checking result.error, but we ensure it's JSON.
  const data = await response.json();
  return data as T;
}


export const fetchModels = async (): Promise<OllamaModel[]> => {
  const response = await fetch(`${BACKEND_API_URL}/models`);
  const data = await handleResponse<{ models: OllamaModel[] }>(response);
  return data.models || []; // Ollama returns { models: [...] }
};

export const uploadGgufFile = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('ggufFile', file);

  const response = await fetch(`${BACKEND_API_URL}/upload-gguf`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<UploadResponse>(response);
};

export const generateText = async (model: string, prompt: string): Promise<GenerateResponse> => {
  const response = await fetch(`${BACKEND_API_URL}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, prompt, stream: false }), // Assuming stream is false for simple test
  });
  // Note: Ollama's /api/generate can return 200 OK with an `error` field in the JSON response.
  // The handleResponse function will parse JSON, but specific error field check should be done by caller.
  const data = await response.json(); 
  return data as GenerateResponse;
};

export const deleteModel = async (modelName: string): Promise<UploadResponse> => {
  const response = await fetch(`${BACKEND_API_URL}/models/${modelName}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json', // Ollama's delete endpoint expects this
    },
    // Ollama's /api/delete expects the model name in the body
    body: JSON.stringify({ name: modelName }), 
  });
  return handleResponse<UploadResponse>(response);
};
