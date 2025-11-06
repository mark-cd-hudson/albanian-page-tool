import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Book, PageData } from "../types";

interface BookDetailPageProps {
  books: Book[];
  pages: PageData[];
  onSelectPage: (page: PageData) => void;
  onDeletePage: (id: string) => void;
}

export const BookDetailPage: React.FC<BookDetailPageProps> = ({
  books,
  pages,
  onSelectPage,
  onDeletePage,
}) => {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();

  const book = books.find((b) => b.id === bookId);
  const bookPages = pages
    .filter((p) => p.bookId === bookId)
    .sort((a, b) => {
      // Sort by page number if available, otherwise by timestamp
      if (a.pageNumber && b.pageNumber) {
        return a.pageNumber - b.pageNumber;
      }
      return b.timestamp - a.timestamp;
    });

  if (!book) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Book not found
          </h2>
          <Link
            to="/books"
            className="text-[#9C7556] dark:text-[#D4A574] hover:text-[#7A5639] dark:hover:text-[#C9A671] font-medium"
          >
            ← Back to Books
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/books"
            className="text-[#9C7556] dark:text-[#D4A574] hover:text-[#7A5639] dark:hover:text-[#C9A671] font-medium inline-flex items-center gap-1 mb-4"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Books
          </Link>

          <div className="flex gap-6">
            {book.coverImageUrl && (
              <img
                src={book.coverImageUrl}
                alt={book.title}
                className="w-32 h-40 object-cover rounded-lg shadow-md"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {book.title}
              </h1>
              {book.author && (
                <p className="text-lg text-gray-700 dark:text-gray-300 mb-2">
                  by {book.author}
                </p>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {book.language}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                {bookPages.length} {bookPages.length === 1 ? "page" : "pages"}
              </p>
            </div>
          </div>
        </div>

        {/* Pages List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Pages
            </h2>
            <Link
              to="/create-page"
              className="px-4 py-2 bg-[#9C7556] dark:bg-[#3E2E22] text-white rounded-lg hover:bg-[#7A5639] dark:hover:bg-[#2C1F16] transition-colors font-medium text-sm"
            >
              + Add Page
            </Link>
          </div>

          {bookPages.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No pages yet
              </p>
              <Link
                to="/create-page"
                className="text-[#9C7556] dark:text-[#D4A574] hover:text-[#7A5639] dark:hover:text-[#C9A671] font-medium"
              >
                Add your first page
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookPages.map((page) => (
                <div
                  key={page.id}
                  className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  <button
                    onClick={() => {
                      onSelectPage(page);
                      navigate(`/pages/${page.id}`);
                    }}
                    className="w-full text-left"
                  >
                    {page.imageDataUrl ? (
                      <img
                        src={page.imageDataUrl}
                        alt={`Page ${page.pageNumber || page.id}`}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <svg
                          className="w-12 h-12 text-gray-400 dark:text-gray-500"
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
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        {page.pageNumber ? (
                          <span className="font-semibold text-gray-900 dark:text-white">
                            Page {page.pageNumber}
                          </span>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400 text-sm">
                            No page number
                          </span>
                        )}
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(page.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {page.originalText.substring(0, 100)}...
                      </p>
                    </div>
                  </button>
                  <div className="px-4 pb-3 flex justify-end">
                    <button
                      onClick={() => onDeletePage(page.id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
