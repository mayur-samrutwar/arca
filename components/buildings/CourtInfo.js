import React from 'react';

export default function CourtInfo({ agentsInfo }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400">All Agents</h4>
        <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
          {agentsInfo?.map((info, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <img
                src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${info.result[0]}`}
                alt={info.result[0]}
                className="w-12 h-12 rounded-full"
              />
              <div className="flex-1">
                <div className="font-medium">{info.result[0]}</div>
                <div className="text-sm text-gray-500 capitalize">{info.result[3]}</div>
                <div className="text-xs text-blue-500">Reputation: 20</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}