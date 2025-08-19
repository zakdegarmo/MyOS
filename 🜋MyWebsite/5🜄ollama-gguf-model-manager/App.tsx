
import React, { useState, useEffect, useCallback } from 'react';
import { OllamaModel, GenerateResponse, ApiErrorResponse } from './types';
import { BACKEND_API_URL } from './constants';
import * as apiService from './services/apiService';
import FileUploader from './components/FileUploader';
import ModelList from './components/ModelList';
import ModelTester from './components/ModelTester';
import { RefreshIcon } from './components/icons/RefreshIcon';
import { SpinnerIcon } from './components/icons/SpinnerIcon';

const getDetailedErrorMessage = (error: unknown, context: string): string => {
  if (error instanceof TypeError && error.message.toLowerCase().includes('failed to fetch')) {
    return `Network error during ${context}: Could not connect to the backend server at ${BACKEND_API_URL}. Please check if the server is running, the URL is correct, and CORS is configured if on a different domain.`;
  }
  if (error instanceof Error) {
    return `Error during ${context}: ${error.message || 'An unknown error occurred.'}`;
  }
  return `An unknown error occurred during ${context}.`;
};

const App: React.FC = () => {
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState<boolean>(true);
  const [errorModels, setErrorModels] = useState<string | null>(null);

  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testError, setTestError] = useState<string | null>(null);

  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchModelsList = useCallback(async () => {
    setIsLoadingModels(true);
    setErrorModels(null);
    try {
      const fetchedModels = await apiService.fetchModels();
      setModels(fetchedModels);
    } catch (error) {
      console.error("Error fetching models:", error);
      const displayMessage = getDetailedErrorMessage(error, "model list retrieval");
      setErrorModels(displayMessage);
      showNotification(displayMessage, 'error');
    } finally {
      setIsLoadingModels(false);
    }
  }, []);

  useEffect(() => {
    fetchModelsList();
  }, [fetchModelsList]);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadStatus(`Uploading ${file.name}...`);
    try {
      const result = await apiService.uploadGgufFile(file);
      const successMessage = result.message || `Successfully uploaded ${file.name}.`;
      setUploadStatus(successMessage);
      showNotification(successMessage, 'success');
      fetchModelsList(); // Refresh model list
    } catch (error) {
      console.error("Upload error:", error);
      const displayMessage = getDetailedErrorMessage(error, `file upload (${file.name})`);
      setUploadStatus(displayMessage);
      showNotification(displayMessage, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteModel = async (modelName: string) => {
    if (!window.confirm(`Are you sure you want to delete model "${modelName}"? This action cannot be undone.`)) {
      return;
    }
    try {
      const result = await apiService.deleteModel(modelName);
      const successMessage = result.message || `Successfully deleted ${modelName}.`;
      showNotification(successMessage, 'success');
      fetchModelsList(); // Refresh model list
    } catch (error) {
      console.error("Delete error:", error);
      const displayMessage = getDetailedErrorMessage(error, `deleting model ${modelName}`);
      showNotification(displayMessage, 'error');
    }
  };

  const handleTestModel = async (model: string, prompt: string) => {
    if (!model) {
      showNotification('Please select a model for testing.', 'error');
      return;
    }
    if (!prompt.trim()) {
      showNotification('Please enter a prompt.', 'error');
      return;
    }
    setIsTesting(true);
    setTestResponse(null);
    setTestError(null);
    try {
      const result: GenerateResponse = await apiService.generateText(model, prompt);
      if (result.error) {
        const errorMessage = `Error from model (${model}): ${result.error}`;
        setTestError(errorMessage);
        showNotification(errorMessage, 'error');
      } else {
        setTestResponse(result.response || JSON.stringify(result, null, 2));
      }
    } catch (error) {
      console.error("Test error:", error);
      const displayMessage = getDetailedErrorMessage(error, `model testing with ${model}`);
      setTestError(displayMessage);
      showNotification(displayMessage, 'error');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="min-h-screen container mx-auto p-4 md:p-8 space-y-8">
      {notification && (
        <div 
          className={`fixed top-5 right-5 p-4 rounded-md shadow-lg text-white ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'} z-50 max-w-md break-words`}
          role="alert"
          aria-live="assertive"
        >
          {notification.message}
          <button 
            onClick={() => setNotification(null)} 
            className="ml-4 font-bold float-right leading-none text-xl"
            aria-label="Close notification"
          >
            &times;
          </button>
        </div>
      )}

      <header className="text-center">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
          Ollama GGUF Model Manager
        </h1>
        <p className="text-gray-400 mt-2">Upload, manage, and test your GGUF models with ease.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-gray-800 p-6 rounded-lg shadow-xl" aria-labelledby="upload-heading">
          <h2 id="upload-heading" className="text-2xl font-semibold mb-4 text-pink-400">Upload GGUF Model</h2>
          <FileUploader onFileUpload={handleFileUpload} uploadStatus={uploadStatus} isUploading={isUploading} />
        </section>

        <section className="bg-gray-800 p-6 rounded-lg shadow-xl" aria-labelledby="models-heading">
          <div className="flex justify-between items-center mb-4">
            <h2 id="models-heading" className="text-2xl font-semibold text-purple-400">Available Models</h2>
            <button
              onClick={fetchModelsList}
              disabled={isLoadingModels}
              className="p-2 bg-purple-600 hover:bg-purple-700 rounded-md text-white transition-colors flex items-center disabled:opacity-50"
              aria-label="Refresh model list"
            >
              {isLoadingModels ? <SpinnerIcon className="animate-spin h-5 w-5" /> : <RefreshIcon className="h-5 w-5" />}
            </button>
          </div>
          <ModelList
            models={models}
            isLoading={isLoadingModels}
            error={errorModels}
            onDeleteModel={handleDeleteModel}
          />
        </section>
      </div>

      <section className="bg-gray-800 p-6 rounded-lg shadow-xl" aria-labelledby="test-heading">
        <h2 id="test-heading" className="text-2xl font-semibold mb-4 text-teal-400">Test Model</h2>
        <ModelTester
          models={models}
          onTestModel={handleTestModel}
          testResponse={testResponse}
          isTesting={isTesting}
          testError={testError}
        />
      </section>

      <footer className="text-center text-gray-500 mt-12 pb-8">
        <p>&copy; {new Date().getFullYear()} Ollama GGUF Manager. Ensure your Ollama backend is running and accessible.</p>
        <p>Backend API expected at: <code className="text-sm bg-gray-700 p-1 rounded">{BACKEND_API_URL}</code></p>
      </footer>
    </div>
  );
};

export default App;
