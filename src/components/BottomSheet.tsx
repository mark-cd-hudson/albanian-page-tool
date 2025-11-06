import React from "react";
import { WordInfo } from "../types";

interface BottomSheetProps {
  wordInfo: WordInfo | null;
  onClose: () => void;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  wordInfo,
  onClose,
}) => {
  if (!wordInfo) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-950 border-t-2 border-gray-200 dark:border-gray-800 shadow-2xl z-40 pointer-events-auto">
      <div className="p-6 max-w-2xl mx-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          aria-label="Close"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Word
            </h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {wordInfo.word}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Meaning
            </h3>
            <p className="text-lg text-gray-800 dark:text-gray-200">
              {wordInfo.meaning}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Sentence Translation
            </h3>
            <p className="text-base text-gray-700 dark:text-gray-300 italic">
              {wordInfo.sentenceTranslation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
