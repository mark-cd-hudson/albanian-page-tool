import React from "react";

interface DatabaseUpgradePromptProps {
  onReload: () => void;
}

export const DatabaseUpgradePrompt: React.FC<DatabaseUpgradePromptProps> = ({
  onReload,
}) => {
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
          <div className="mb-6">
            <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Database Update Required
            </h2>
            <p className="text-gray-600 text-center">
              The app needs to update its database to support new features. This
              will only take a moment.
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Your existing pages and settings will be
              preserved.
            </p>
          </div>

          <button
            onClick={onReload}
            className="w-full py-3 px-4 bg-[#9C7556] dark:bg-[#3E2E22] text-white rounded-xl font-medium hover:bg-[#7A5639] dark:hover:bg-[#2C1F16] transition-colors"
          >
            Update Now
          </button>
        </div>
      </div>
    </>
  );
};
