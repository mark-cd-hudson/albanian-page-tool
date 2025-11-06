import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PageData } from "../types";

interface SidebarProps {
  pages: PageData[];
  currentPageId: string | null;
  onSelectPage: (page: PageData) => void;
  onDeletePage: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
  selectedLanguage: string;
  availableLanguages: string[];
  onLanguageChange: (language: string) => void;
  dueCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  pages,
  currentPageId,
  onSelectPage,
  onDeletePage,
  isOpen,
  onClose,
  selectedLanguage,
  availableLanguages,
  onLanguageChange,
  dueCount,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handlePageSelect = (page: PageData) => {
    onSelectPage(page);
    navigate(`/pages/${page.id}`);
    // Close sidebar on mobile after selection
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
      onClose();
    }
  };
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      className={`
        fixed lg:relative inset-y-0 left-0 z-40
        w-80 bg-gray-50 border-r border-gray-200 flex flex-col h-screen
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        ${!isOpen && "lg:w-0 lg:border-r-0"}
      `}
    >
      <div className={`${!isOpen && "lg:hidden"} flex-1 flex flex-col min-h-0`}>
        {/* Close button (mobile only) */}
        <div className="lg:hidden flex justify-end p-4 border-b border-gray-200">
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
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

        {/* Language Selector */}
        <div className="p-4 border-b border-gray-200">
          <label className="block text-xs font-medium text-gray-500 uppercase mb-2">
            Language Filter
          </label>
          <select
            value={selectedLanguage}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Languages</option>
            {availableLanguages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>

        {/* Navigation */}
        <div className="p-4 border-b border-gray-200 space-y-2">
          <button
            onClick={() => {
              // Navigate to most recent page if available, otherwise home
              if (pages.length > 0) {
                handleNavigation(`/pages/${pages[0].id}`);
              } else {
                handleNavigation("/");
              }
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
              location.pathname === "/" ||
              location.pathname.startsWith("/pages/")
                ? "bg-indigo-100 text-indigo-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
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
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            Reader
          </button>
          <button
            onClick={() => handleNavigation("/books")}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
              location.pathname.startsWith("/books")
                ? "bg-indigo-100 text-indigo-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
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
                d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
              />
            </svg>
            Books
          </button>
          <button
            onClick={() => handleNavigation("/create-page")}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Page
          </button>

          <div className="border-t border-gray-300 my-2"></div>

          <button
            onClick={() => handleNavigation("/vocab")}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
              location.pathname === "/vocab"
                ? "bg-indigo-100 text-indigo-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
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
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            Vocabulary
          </button>

          <button
            onClick={() => handleNavigation("/review")}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
              location.pathname === "/review"
                ? "bg-indigo-100 text-indigo-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <span className="flex-1 text-left">Review</span>
            {dueCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                {dueCount}
              </span>
            )}
          </button>

          <button
            onClick={() => handleNavigation("/review-history")}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
              location.pathname === "/review-history"
                ? "bg-indigo-100 text-indigo-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Review History
          </button>

          <button
            onClick={() => handleNavigation("/stats")}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
              location.pathname === "/stats"
                ? "bg-indigo-100 text-indigo-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            Statistics
          </button>
        </div>

        {/* Recent Pages Header */}
        <div className="px-4 py-2 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
            Recent Pages
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {pages.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No pages yet. Upload your first page!
            </div>
          ) : (
            <div className="p-2">
              {pages.map((page) => (
                <div
                  key={page.id}
                  className={`relative group mb-2 p-3 rounded-lg cursor-pointer transition-all ${
                    currentPageId === page.id
                      ? "bg-indigo-100 border-2 border-indigo-500"
                      : "bg-white border border-gray-200 hover:border-indigo-300"
                  }`}
                  onClick={() => handlePageSelect(page)}
                >
                  <div className="flex items-start">
                    {page.imageDataUrl ? (
                      <img
                        src={page.imageDataUrl}
                        alt="Page thumbnail"
                        className="w-16 h-16 object-cover rounded mr-3"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-indigo-100 rounded mr-3 flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-indigo-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {page.paragraphs[0]?.sentences[0]?.text.substring(
                          0,
                          40
                        ) || "Empty page"}
                        ...
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        <span className="inline-block px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium mr-1">
                          {page.language}
                        </span>
                        {page.pageNumber && `p.${page.pageNumber} • `}
                        {formatDate(page.timestamp)}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {page.paragraphs.reduce(
                          (total, p) => total + p.sentences.length,
                          0
                        )}{" "}
                        sentences
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm("Delete this page?")) {
                        onDeletePage(page.id);
                      }
                    }}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-all"
                  >
                    <svg
                      className="w-4 h-4"
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
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
