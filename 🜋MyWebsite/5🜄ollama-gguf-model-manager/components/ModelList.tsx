
import React from 'react';
import { OllamaModel } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';

interface ModelListProps {
  models: OllamaModel[];
  isLoading: boolean;
  error: string | null;
  onDeleteModel: (modelName: string) => Promise<void>;
}

const ModelList: React.FC<ModelListProps> = ({ models, isLoading, error, onDeleteModel }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4 text-gray-400">
        <SpinnerIcon className="animate-spin h-8 w-8 mr-3 text-purple-400" />
        Loading models...
      </div>
    );
  }

  if (error) {
    return <p className="text-red-400 p-4">Error: {error}</p>;
  }

  if (models.length === 0) {
    return <p className="text-gray-400 p-4">No models available. Upload a GGUF file to get started.</p>;
  }
  
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };


  return (
    <div className="max-h-96 overflow-y-auto bg-gray-850 rounded-md">
      <ul className="divide-y divide-gray-700">
        {models.map((model) => (
          <li key={model.digest || model.name} className="p-4 hover:bg-gray-750 transition-colors duration-150">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-medium text-purple-300">{model.name}</p>
                <p className="text-sm text-gray-400">
                  Size: {formatBytes(model.size)}
                </p>
                <p className="text-xs text-gray-500">
                  Modified: {new Date(model.modified_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => onDeleteModel(model.name)}
                className="p-2 text-red-500 hover:text-red-400 hover:bg-red-900 rounded-full transition-colors"
                aria-label={`Delete model ${model.name}`}
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ModelList;
