import React from "react";
import { PageData } from "../types";

interface SidebarProps {
  pages: PageData[];
  currentPageId: string | null;
  onSelectPage: (page: PageData) => void;
  onDeletePage: (id: string) => void;
  onNewPage: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  pages,
  currentPageId,
  onSelectPage,
  onDeletePage,
  onNewPage,
}) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col h-screen">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Page History</h2>
        <button
          onClick={onNewPage}
          className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          + New Page
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
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
                onClick={() => onSelectPage(page)}
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
  );
};
