import React from "react";

interface ProcessingScreenProps {
  step: "extracting" | "splitting" | "translating" | "saving";
  currentPage?: number;
  totalPages?: number;
}

const steps = {
  extracting: {
    title: "Extracting Text",
    description: "Reading text from your image...",
    progress: 25,
  },
  splitting: {
    title: "Analyzing Sentences",
    description: "Breaking text into sentences...",
    progress: 40,
  },
  translating: {
    title: "Translating Content",
    description: "Translating sentences and words...",
    progress: 70,
  },
  saving: {
    title: "Saving Page",
    description: "Almost done...",
    progress: 95,
  },
};

export const ProcessingScreen: React.FC<ProcessingScreenProps> = ({ 
  step, 
  currentPage, 
  totalPages 
}) => {
  const currentStep = steps[step];

  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="max-w-md w-full">
        {/* Page progress indicator */}
        {currentPage && totalPages && totalPages > 1 && (
          <div className="text-center mb-4">
            <div className="inline-block px-4 py-2 bg-[#E8D5C4] dark:bg-gray-800 rounded-full">
              <span className="text-sm font-semibold text-[#7A5639] dark:text-[#D4A574]">
                Page {currentPage} of {totalPages}
              </span>
            </div>
          </div>
        )}

        {/* Animated spinner */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 border-8 border-[#D4B89C] dark:border-gray-700 rounded-full"></div>
            <div className="w-24 h-24 border-8 border-[#9C7556] dark:border-[#8B6F47] rounded-full animate-spin border-t-transparent absolute top-0 left-0"></div>
          </div>
        </div>

        {/* Status text */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {currentStep.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">{currentStep.description}</p>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
          <div
            className="bg-[#9C7556] dark:bg-[#8B6F47] h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${currentStep.progress}%` }}
          ></div>
        </div>

        {/* Progress percentage */}
        <div className="text-center">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {currentStep.progress}% Complete
          </span>
        </div>

        {/* Info message */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            This may take a minute depending on the page length. Please don't
            close this tab.
          </p>
        </div>
      </div>
    </div>
  );
};
