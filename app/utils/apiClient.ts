const API_BASE_URL = 'http://localhost:8000/api';

export interface SymbolSubmission {
  symbol: number;
  student_id: number;
}

export interface PredictionResponse {
  success: boolean;
  next_prediction: number;
  confidence: number;
  entropy: number;
  last_correct: boolean | null;
}

export interface Pattern {
  pattern: number[];
  occurrences: number;
}

export interface PredictionModel {
  predictions: {
    'Monte Carlo': number;
    'ARIMA': number;
    'LSTM': number;
    'Markov': number;
  };
  confidence: {
    'Monte Carlo': number;
    'ARIMA': number;
    'LSTM': number;
    'Markov': number;
  };
}

export const submitSymbol = async (data: SymbolSubmission): Promise<PredictionResponse> => {
  const response = await fetch(`${API_BASE_URL}/submit-symbol`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const getPatterns = async (studentId: number): Promise<{ patterns: Pattern[] }> => {
  const response = await fetch(`${API_BASE_URL}/pattern-analysis/${studentId}`);
  return response.json();
};

export const getEntropy = async (studentId: number): Promise<{ entropy_value: number; trend: string }> => {
  const response = await fetch(`${API_BASE_URL}/entropy/${studentId}`);
  return response.json();
};

export const getPredictions = async (studentId: number): Promise<PredictionModel> => {
  const response = await fetch(`${API_BASE_URL}/predictions/${studentId}`);
  return response.json();
};
