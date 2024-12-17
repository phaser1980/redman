import React, { useState } from 'react';

interface TooltipProps {
  content: React.ReactNode;
  children?: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block ml-2">
      <button
        className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
      >
        {children || (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )}
      </button>
      {isVisible && (
        <div className="absolute z-10 w-64 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 -left-28 bottom-full mb-2">
          <div className="relative">
            {content}
            <div className="absolute w-3 h-3 bg-white dark:bg-gray-800 border-b border-r border-gray-200 dark:border-gray-700 transform rotate-45 -bottom-1.5 left-1/2 -translate-x-1/2" />
          </div>
        </div>
      )}
    </div>
  );
};
