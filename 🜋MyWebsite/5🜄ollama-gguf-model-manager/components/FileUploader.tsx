
import React, { useState, useCallback, useRef } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';

interface FileUploaderProps {
  onFileUpload: (file: File) => Promise<void>;
  uploadStatus: string | null;
  isUploading: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileUpload, uploadStatus, isUploading }) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      // Currently handles only one file at a time from drop, can be extended
      if (e.dataTransfer.files[0].name.endsWith('.gguf')) {
        await onFileUpload(e.dataTransfer.files[0]);
      } else {
        alert("Please drop a .gguf file.");
      }
    }
  }, [onFileUpload]);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
       if (e.target.files[0].name.endsWith('.gguf')) {
        await onFileUpload(e.target.files[0]);
      } else {
        alert("Please select a .gguf file.");
      }
      // Reset file input to allow uploading the same file again
      if(inputRef.current) {
        inputRef.current.value = ""; 
      }
    }
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <form
        className={`w-full p-8 border-2 ${dragActive ? 'border-pink-500 bg-gray-700' : 'border-gray-600 border-dashed'} rounded-lg text-center cursor-pointer transition-all duration-300 ease-in-out`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onSubmit={(e) => e.preventDefault()}
        onClick={onButtonClick}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".gguf"
          onChange={handleChange}
          disabled={isUploading}
        />
        <div className="flex flex-col items-center justify-center space-y-2">
          <UploadIcon className={`w-12 h-12 ${dragActive ? 'text-pink-400' : 'text-gray-400'}`} />
          <p className={`${dragActive ? 'text-pink-300' : 'text-gray-300'}`}>
            Drag & drop your .gguf file here
          </p>
          <p className="text-sm text-gray-500">or click to select file</p>
        </div>
      </form>
      {isUploading && (
        <div className="flex items-center text-sm text-yellow-400">
          <SpinnerIcon className="animate-spin h-5 w-5 mr-2" />
          Processing...
        </div>
      )}
      {uploadStatus && (
        <p className={`text-sm ${uploadStatus.toLowerCase().includes('error') ? 'text-red-400' : 'text-green-400'}`}>
          {uploadStatus}
        </p>
      )}
    </div>
  );
};

export default FileUploader;
