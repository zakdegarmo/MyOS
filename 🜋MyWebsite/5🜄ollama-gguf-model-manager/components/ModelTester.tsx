
import React, { useState, useEffect } from 'react';
import { OllamaModel, GenerateResponse } from '../types';
import { SpinnerIcon } from './icons/SpinnerIcon';

interface ModelTesterProps {
  models: OllamaModel[];
  onTestModel: (model: string, prompt: string) => Promise<void>;
  testResponse: string | null;
  isTesting: boolean;
  testError: string | null;
}

const ModelTester: React.FC<ModelTesterProps> = ({ models, onTestModel, testResponse, isTesting, testError }) => {
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('');

  useEffect(() => {
    // Auto-select first model if available and none is selected
    if (models.length > 0 && !selectedModel) {
      setSelectedModel(models[0].name);
    }
  }, [models, selectedModel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedModel && prompt) {
      onTestModel(selectedModel, prompt);
    } else if (!selectedModel) {
        alert("Please select a model.");
    } else {
        alert("Please enter a prompt.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="modelSelect" className="block text-sm font-medium text-gray-300 mb-1">
          Select Model:
        </label>
        <select
          id="modelSelect"
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:ring-teal-500 focus:border-teal-500 text-gray-100 disabled:opacity-50"
          disabled={models.length === 0 || isTesting}
        >
          {models.length === 0 ? (
            <option value="">No models available</option>
          ) : (
            models.map((model) => (
              <option key={model.digest || model.name} value={model.name}>
                {model.name}
              </option>
            ))
          )}
        </select>
      </div>

      <div>
        <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-1">
          Enter Prompt:
        </label>
        <textarea
          id="prompt"
          rows={5}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:ring-teal-500 focus:border-teal-500 text-gray-100 disabled:opacity-50"
          placeholder="e.g., Why is the sky blue?"
          disabled={isTesting}
        />
      </div>

      <button
        type="submit"
        disabled={isTesting || !selectedModel || !prompt.trim()}
        className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-teal-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
      >
        {isTesting ? (
          <>
            <SpinnerIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
            Generating...
          </>
        ) : (
          'Send to Model'
        )}
      </button>

      {(testResponse || testError) && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-300 mb-2">Response:</h3>
          {testError && (
            <pre className="p-4 bg-red-900 bg-opacity-30 border border-red-700 text-red-300 rounded-md whitespace-pre-wrap break-all">
              {testError}
            </pre>
          )}
          {testResponse && (
            <pre className="p-4 bg-gray-700 border border-gray-600 text-gray-200 rounded-md whitespace-pre-wrap break-all">
              {testResponse}
            </pre>
          )}
        </div>
      )}
    </form>
  );
};

export default ModelTester;
