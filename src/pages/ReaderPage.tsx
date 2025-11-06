import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { TextDisplay } from "../components/TextDisplay";
import { PageData, WordInfo } from "../types";

interface ReaderPageProps {
  pages: PageData[];
  onWordClick: (
    wordInfo: WordInfo,
    pageId: string,
    pageLanguage: string,
    sentenceText: string,
    sentenceWords: Map<string, WordInfo>
  ) => void;
  selectedWord: WordInfo | null;
}

export const ReaderPage: React.FC<ReaderPageProps> = ({
  pages,
  onWordClick,
  selectedWord,
}) => {
  const { pageId } = useParams<{ pageId?: string }>();
  const navigate = useNavigate();

  // If pageId is provided, find that page
  let currentPage: PageData | null = null;
  if (pageId) {
    currentPage = pages.find((p) => p.id === pageId) || null;
  }

  // Page not found
  if (pageId && !currentPage) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <svg
              className="w-20 h-20 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Page not found
          </h2>
          <p className="text-gray-600 mb-4">
            This page may have been deleted or doesn't exist
          </p>
          <Link
            to="/"
            className="text-[#9C7556] dark:text-[#D4A574] hover:text-[#7A5639] dark:hover:text-[#C9A671] font-medium"
          >
            ← Go back
          </Link>
        </div>
      </div>
    );
  }

  // No page selected - show most recent or empty state
  if (!currentPage) {
    // If we have pages, redirect to the most recent one
    if (pages.length > 0) {
      const mostRecentPage = pages[0];
      navigate(`/pages/${mostRecentPage.id}`, { replace: true });
      return null;
    }

    // Empty state - no pages at all
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <svg
              className="w-20 h-20 mx-auto"
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
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            No pages yet
          </h2>
          <p className="text-gray-600 mb-4">
            Upload your first page to get started
          </p>
          <Link
            to="/create-page"
            className="inline-block px-4 py-2 bg-[#9C7556] dark:bg-[#3E2E22] text-white rounded-lg hover:bg-[#7A5639] font-medium"
          >
            Add Page
          </Link>
        </div>
      </div>
    );
  }

  return (
    <TextDisplay
      page={currentPage}
      onWordClick={(wordInfo, sentenceText, sentenceWords) =>
        onWordClick(
          wordInfo,
          currentPage.id,
          currentPage.language,
          sentenceText,
          sentenceWords
        )
      }
      selectedWord={selectedWord}
    />
  );
};
