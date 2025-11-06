import React, { useState } from "react";
import { AppSettings } from "../types";
import { COMMON_LANGUAGES, DEFAULT_NATIVE_LANGUAGE } from "../constants";
import { indexedDBService } from "../services/indexedDB";

interface SettingsProps {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => Promise<void>;
  onClose: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  settings,
  onSaveSettings,
  onClose,
}) => {
  const [newApiKey, setNewApiKey] = useState(settings.apiKey);
  const [nativeLanguage, setNativeLanguage] = useState(
    settings.nativeLanguage || DEFAULT_NATIVE_LANGUAGE
  );
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = async () => {
    await onSaveSettings({
      apiKey: newApiKey,
      nativeLanguage,
      recentLanguages: settings.recentLanguages,
      selectedLanguage: settings.selectedLanguage,
    });
    onClose();
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const jsonData = await indexedDBService.exportAllData();

      // Create download
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `language-learning-backup-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("Failed to export data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const text = await file.text();
      await indexedDBService.importAllData(text);
      alert("Data imported successfully! The page will reload.");
      window.location.reload();
    } catch (error) {
      console.error("Error importing data:", error);
      alert(
        `Failed to import data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = "";
    }
  };

  const handleDeleteAll = async () => {
    try {
      setIsDeleting(true);
      await indexedDBService.deleteAllData();
      alert("All data deleted successfully! The page will reload.");
      window.location.reload();
    } catch (error) {
      console.error("Error deleting data:", error);
      alert("Failed to delete data. Please try again.");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-950 rounded-2xl shadow-2xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
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
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Native Language (Translation Target)
              </label>
              <select
                value={nativeLanguage}
                onChange={(e) => setNativeLanguage(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-[#9C7556] dark:focus:ring-[#8B6F47] focus:border-[#9C7556] dark:focus:border-[#8B6F47] outline-none"
              >
                <option value="English">English</option>
                {COMMON_LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
                Pages will be translated into this language.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Anthropic API Key
              </label>
              <input
                type="password"
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
                placeholder="sk-ant-..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-[#9C7556] dark:focus:ring-[#8B6F47] focus:border-[#9C7556] dark:focus:border-[#8B6F47] outline-none"
              />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
                Your API key is stored locally in your browser and never sent
                anywhere except to Anthropic.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <svg
                  className="w-5 h-5 text-blue-600 mt-0.5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Get your API key</p>
                  <p>
                    Visit{" "}
                    <a
                      href="https://console.anthropic.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      console.anthropic.com
                    </a>{" "}
                    to get your API key
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Data Management Section */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Data Management
            </h3>

            <div className="space-y-3">
              {/* Export Button */}
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                {isExporting ? "Exporting..." : "Export Data"}
              </button>

              {/* Import Button */}
              <label className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors cursor-pointer">
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
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                {isImporting ? "Importing..." : "Import Data"}
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  disabled={isImporting}
                  className="hidden"
                />
              </label>

              {/* Delete Button */}
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-red-300 text-red-700 rounded-lg font-medium hover:bg-red-50 transition-colors"
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete All Data
                </button>
              ) : (
                <div className="bg-red-50 border border-red-300 rounded-lg p-4">
                  <p className="text-sm font-medium text-red-900 mb-3">
                    Are you sure? This will permanently delete all your data,
                    including pages, books, vocabulary, and review history. This
                    action cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteAll}
                      disabled={isDeleting}
                      className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {isDeleting ? "Deleting..." : "Yes, Delete All"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
              Export your data to back it up or transfer to another device.
              Import will replace all existing data.
            </p>
          </div>

          <div className="mt-6 flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-2 px-4 bg-[#9C7556] dark:bg-[#3E2E22] text-white rounded-lg font-medium hover:bg-[#7A5639] transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
