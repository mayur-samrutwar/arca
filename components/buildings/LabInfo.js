import React, { useState, useEffect } from 'react';

export default function LabInfo({ agentsInfo }) {
  const [isResearching, setIsResearching] = useState(false);
  const [researchThread, setResearchThread] = useState([]);
  const [researchPaper, setResearchPaper] = useState(null);
  const researchers = agentsInfo?.filter(info => info.result[3] === 'researcher') || [];

  const startResearch = async () => {
    if (researchers.length < 2) {
      alert('Need at least 2 researchers to start a discussion');
      return;
    }

    setIsResearching(true);
    
    try {
      const response = await fetch('/api/research/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          researchers: researchers.map(r => ({
            name: r.result[0],
            occupation: r.result[3],
          }))
        })
      });

      if (!response.ok) {
        throw new Error(`Research generation failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.discussion) {
        setResearchThread(data.discussion);
      }
      if (data.paper) {
        setResearchPaper(data.paper);
      }
      setIsResearching(false);
    } catch (error) {
      console.error('Failed to generate research:', error);
      setIsResearching(false);
      alert('Failed to generate research. Please try again.');
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup any ongoing research when component unmounts
      setIsResearching(false);
      setResearchThread([]);
      setResearchPaper(null);
    };
  }, []);

  return (
    <div className="p-6 max-h-[calc(100vh-4rem)] overflow-y-auto">
      <button
        onClick={startResearch}
        disabled={isResearching}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {isResearching ? 'Generating Research...' : 'Start Research Discussion'}
      </button>

      {/* Research Thread */}
      {researchThread?.length > 0 && (
        <div className="mt-6 space-y-4">
          {researchThread.map((message, index) => (
            <div key={index} className="flex items-start gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <img 
                src={`https://api.dicebear.com/7.x/personas/svg?seed=${message.researcher}`}
                alt={message.researcher}
                className="w-12 h-12 rounded-full bg-gray-100"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-blue-600 dark:text-blue-400">
                  {message.researcher}
                </p>
                <p className="mt-1 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {message.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Research Paper Link */}
      {researchPaper && (
        <div className="mt-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">{researchPaper.title}</h2>
          <p className="mb-4 text-gray-600 dark:text-gray-300">
            {researchPaper.abstract?.substring(0, 200)}...
          </p>
          {researchPaper.findings?.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Key Findings</h3>
              <ul className="list-disc pl-5">
                {researchPaper.findings.map((finding, index) => (
                  <li key={index} className="text-gray-600 dark:text-gray-300">{finding}</li>
                ))}
              </ul>
            </div>
          )}
          {researchPaper.conclusions?.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Conclusions</h3>
              <ul className="list-disc pl-5">
                {researchPaper.conclusions.map((conclusion, index) => (
                  <li key={index} className="text-gray-600 dark:text-gray-300">{conclusion}</li>
                ))}
              </ul>
            </div>
          )}
          <a 
            href={`/api/research/paper/${researchPaper._id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            View Full Research Paper →
          </a>
        </div>
      )}
    </div>
  );
}