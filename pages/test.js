import { useState } from 'react';

export default function SetupResearch() {
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);

  const createAssistant = async () => {
    setStatus('loading');
    setError(null);
    setErrorDetails(null);
    
    try {
      const response = await fetch('/api/research/create-assistant', {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to create assistant');
      }
      
      setResult(data);
      setStatus('success');
    } catch (error) {
      console.error('Setup failed:', error);
      setError(error.message);
      setErrorDetails(error.details);
      setStatus('error');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Research Assistant Setup</h1>
      
      <div className="space-y-4">
        <button
          onClick={createAssistant}
          disabled={status === 'loading'}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {status === 'loading' ? 'Creating...' : 'Create Research Assistant'}
        </button>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg">
            <h3 className="font-medium">Error</h3>
            <p>{error}</p>
            {errorDetails && (
              <div className="mt-2 text-sm border-t border-red-200 pt-2">
                <p className="font-medium">Details:</p>
                <pre className="mt-1 whitespace-pre-wrap">{errorDetails}</pre>
              </div>
            )}
          </div>
        )}

        {result && (
          <div className="p-4 bg-green-50 text-green-700 rounded-lg">
            <h3 className="font-medium">Success!</h3>
            <p className="mt-2">Assistant ID: {result.assistantId}</p>
            <p className="mt-1">Created at: {new Date(result.created_at).toLocaleString()}</p>
            <p className="mt-4 text-sm">
              Add this ID to your .env file as OPENAI_ASSISTANT_ID
            </p>
          </div>
        )}

        {/* Debug Info */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg text-sm">
          <h3 className="font-medium mb-2">Debug Information</h3>
          <p>Status: {status}</p>
          <p>API Key Set: {process.env.NEXT_PUBLIC_OPENAI_API_KEY ? 'Yes' : 'No'}</p>
        </div>
      </div>
    </div>
  );
}