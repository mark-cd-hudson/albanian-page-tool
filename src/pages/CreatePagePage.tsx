import React from "react";
import { useNavigate } from "react-router-dom";
import { PageUploadForm } from "../components/PageUploadForm";
import { Book } from "../types";

interface CreatePagePageProps {
  onImageSelect: (data: {
    dataUrls: string[];
    language: string;
    bookId?: string;
    startingPageNumber?: number;
  }) => void;
  isProcessing: boolean;
  recentLanguages: string[];
  books: Book[];
  onCreateBook: (book: Omit<Book, "id" | "createdAt">) => Promise<string>;
  defaultLanguage?: string;
  defaultBookId?: string;
}

export const CreatePagePage: React.FC<CreatePagePageProps> = (props) => {
  const navigate = useNavigate();

  return (
    <div className="h-full overflow-y-auto relative">
      {/* Back Button */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-4 left-4 z-10 p-2 bg-white dark:bg-gray-900 rounded-lg shadow-md hover:shadow-lg transition-shadow text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-transparent dark:border-gray-700"
        title="Back to reading"
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
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      <PageUploadForm {...props} />
    </div>
  );
};
