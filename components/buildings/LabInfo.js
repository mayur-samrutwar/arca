import React from 'react';

export default function LabInfo({ agentsInfo }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400">Researchers</h4>
        <div className="max-h-96 overflow-y-auto space-y-2">
          {agentsInfo?.filter(info => info.result[3] === 'researcher').map((info, index) => (
            <div key={index} className="flex items-center space-x-3 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
              <img
                src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${info.result[0]}`}
                alt={info.result[0]}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <div className="font-medium">{info.result[0]}</div>
                <div className="text-sm text-gray-500 capitalize">{info.result[3]}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}