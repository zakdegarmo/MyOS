
export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details?: {
    format: string;
    family: string;
    families: string[] | null;
    parameter_size: string;
    quantization_level: string;
  };
}

export interface UploadResponse {
  message: string;
}

export interface GenerateResponse {
  model?: string;
  created_at?: string;
  response?: string;
  done?: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
  error?: string; // Ollama specific error
}

export interface ApiErrorResponse {
  error: string; // General backend error
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  // other types of chunks can be added here
}

export interface GroundingMetadata {
  searchQueries?: string[];
  groundingChunks?: GroundingChunk[];
}

export interface Candidate {
  content?: {
    parts: { text?: string; json?: any; inlineData?: {mimeType: string, data: string}}[]; // Adjusted for potential inline data or json
    role: string;
  };
  finishReason?: string;
  safetyRatings?: {
    category: string;
    probability: string;
  }[];
  citationMetadata?: {
    citationSources: {
      startIndex: number;
      endIndex: number;
      uri: string;
      license: string;
    }[];
  };
  tokenCount?: number;
  groundingMetadata?: GroundingMetadata;
}

export interface GeminiApiRequest {
  model: string;
  contents: string | { parts: { text: string }[] } | { parts: ({ text: string } | { inlineData: { mimeType: string, data: string } })[] };
  config?: {
    systemInstruction?: string;
    topK?: number;
    topP?: number;
    temperature?: number;
    responseMimeType?: string;
    seed?: number;
    tools?: { googleSearch: {} }[];
    thinkingConfig?: { thinkingBudget: number };
  };
}


export interface GeminiApiResponse {
  candidates?: Candidate[];
  promptFeedback?: {
    blockReason: string;
    safetyRatings: {
      category: string;
      probability: string;
    }[];
  };
  text: string; // Helper property for direct text access
}

export interface GeminiImageGenerationResponse {
  generatedImages: {
    image: {
      imageBytes: string; // base64 encoded image
      mimeType: string;
    };
    finishReason: string;
  }[];
}
