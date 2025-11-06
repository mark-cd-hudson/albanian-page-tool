import React, { useState, useRef } from "react";
import { Book } from "../types";
import { COMMON_LANGUAGES } from "../constants";
import { compressImage } from "../utils/imageCompression";

interface PageUploadFormProps {
  onImageSelect: (data: {
    dataUrl: string;
    language: string;
    bookId?: string;
    pageNumber?: number;
  }) => void;
  isProcessing: boolean;
  recentLanguages: string[];
  books: Book[];
  onCreateBook: (book: Omit<Book, "id" | "createdAt">) => Promise<string>;
  defaultLanguage?: string;
  defaultBookId?: string;
}

export const PageUploadForm: React.FC<PageUploadFormProps> = ({
  onImageSelect,
  isProcessing,
  recentLanguages,
  books,
  onCreateBook,
  defaultLanguage = "",
  defaultBookId = "",
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [language, setLanguage] = useState<string>(defaultLanguage);
  const [customLanguage, setCustomLanguage] = useState<string>("");
  const [bookId, setBookId] = useState<string>(defaultBookId);
  const [pageNumber, setPageNumber] = useState<string>("");
  const [showNewBookForm, setShowNewBookForm] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState("");
  const [newBookAuthor, setNewBookAuthor] = useState("");
  const [newBookCoverUrl, setNewBookCoverUrl] = useState<string>("");
  const bookCoverInputRef = useRef<HTMLInputElement>(null);

  const allLanguages = Array.from(
    new Set([...recentLanguages, ...COMMON_LANGUAGES])
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImageDataUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!imageDataUrl) {
      alert("Please select an image first");
      return;
    }

    const selectedLanguage = language === "custom" ? customLanguage : language;
    if (!selectedLanguage) {
      alert("Please select or enter a language");
      return;
    }

    let finalBookId = bookId;
    if (showNewBookForm && newBookTitle) {
      // Create new book
      finalBookId = await onCreateBook({
        title: newBookTitle,
        author: newBookAuthor || undefined,
        language: selectedLanguage,
        coverImageUrl: newBookCoverUrl || undefined,
      });
    }

    onImageSelect({
      dataUrl: imageDataUrl,
      language: selectedLanguage,
      bookId: finalBookId || undefined,
      pageNumber: pageNumber ? parseInt(pageNumber) : undefined,
    });

    // Reset form (keeping defaults for language and book)
    setImageDataUrl(null);
    setLanguage(defaultLanguage);
    setCustomLanguage("");
    setBookId(defaultBookId);
    setPageNumber("");
    setShowNewBookForm(false);
    setNewBookTitle("");
    setNewBookAuthor("");
    setNewBookCoverUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (bookCoverInputRef.current) {
      bookCoverInputRef.current.value = "";
    }
  };

  const handleBookCoverChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      // Compress the cover image (smaller size for covers)
      const compressed = await compressImage(dataUrl, 400, 0.8);
      setNewBookCoverUrl(compressed);
    };
    reader.readAsDataURL(file);
  };

  const languageBooksCount = books.filter(
    (b) => b.language === (language === "custom" ? customLanguage : language)
  ).length;

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 overflow-y-auto">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#E8D5C4] rounded-full mb-4">
            <svg
              className="w-10 h-10 text-[#9C7556] dark:text-[#8B6F47]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Upload a Page
          </h2>
          <p className="text-gray-600">
            Upload an image of a page from a book to get started
          </p>
        </div>

        {/* Image Preview */}
        {imageDataUrl && (
          <div className="mb-6">
            <img
              src={imageDataUrl}
              alt="Preview"
              className="max-w-full h-auto mx-auto rounded-lg shadow-md"
              style={{ maxHeight: "200px" }}
            />
          </div>
        )}

        <div className="space-y-4">
          {/* Image Selection */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={isProcessing}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="w-full py-3 px-6 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
            >
              {imageDataUrl ? "Change Image" : "Choose Image"}
            </button>
          </div>

          {imageDataUrl && (
            <>
              {/* Language Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source Language *
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-[#9C7556] dark:focus:ring-[#8B6F47] focus:border-[#9C7556] dark:focus:border-[#8B6F47] outline-none"
                >
                  <option value="">Select a language...</option>
                  {allLanguages.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                  <option value="custom">Other (specify below)</option>
                </select>
              </div>

              {language === "custom" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter Language Name *
                  </label>
                  <input
                    type="text"
                    value={customLanguage}
                    onChange={(e) => setCustomLanguage(e.target.value)}
                    placeholder="e.g., Swahili"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-[#9C7556] dark:focus:ring-[#8B6F47] focus:border-[#9C7556] dark:focus:border-[#8B6F47] outline-none"
                  />
                </div>
              )}

              {/* Book Selection */}
              {language && language !== "custom" && languageBooksCount > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Book (Optional)
                  </label>
                  <select
                    value={bookId}
                    onChange={(e) => {
                      setBookId(e.target.value);
                      setShowNewBookForm(e.target.value === "new");
                    }}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-[#9C7556] dark:focus:ring-[#8B6F47] focus:border-[#9C7556] dark:focus:border-[#8B6F47] outline-none"
                  >
                    <option value="">No book selected</option>
                    {books
                      .filter((b) => b.language === language)
                      .map((book) => (
                        <option key={book.id} value={book.id}>
                          {book.title}
                          {book.author ? ` by ${book.author}` : ""}
                        </option>
                      ))}
                    <option value="new">+ Create New Book</option>
                  </select>
                </div>
              )}

              {(language === "custom" ||
                (language && languageBooksCount === 0)) && (
                <div>
                  <button
                    onClick={() => setShowNewBookForm(!showNewBookForm)}
                    className="text-[#9C7556] dark:text-[#D4A574] hover:text-[#7A5639] dark:hover:text-[#C9A671] text-sm font-medium"
                  >
                    {showNewBookForm ? "- Cancel" : "+ Add Book (Optional)"}
                  </button>
                </div>
              )}

              {/* New Book Form */}
              {showNewBookForm && (
                <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Book Title
                    </label>
                    <input
                      type="text"
                      value={newBookTitle}
                      onChange={(e) => setNewBookTitle(e.target.value)}
                      placeholder="Enter book title"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-[#9C7556] dark:focus:ring-[#8B6F47] focus:border-[#9C7556] dark:focus:border-[#8B6F47] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Author (Optional)
                    </label>
                    <input
                      type="text"
                      value={newBookAuthor}
                      onChange={(e) => setNewBookAuthor(e.target.value)}
                      placeholder="Enter author name"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-[#9C7556] dark:focus:ring-[#8B6F47] focus:border-[#9C7556] dark:focus:border-[#8B6F47] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cover Image (Optional)
                    </label>
                    <input
                      ref={bookCoverInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleBookCoverChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => bookCoverInputRef.current?.click()}
                      className="w-full py-2 px-3 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                    >
                      {newBookCoverUrl ? "Change Cover" : "Choose Cover"}
                    </button>
                    {newBookCoverUrl && (
                      <img
                        src={newBookCoverUrl}
                        alt="Book cover preview"
                        className="mt-2 max-w-[100px] h-auto rounded border border-gray-200"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Page Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Page Number (Optional)
                </label>
                <input
                  type="number"
                  value={pageNumber}
                  onChange={(e) => setPageNumber(e.target.value)}
                  placeholder="e.g., 42"
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-[#9C7556] dark:focus:ring-[#8B6F47] focus:border-[#9C7556] dark:focus:border-[#8B6F47] outline-none"
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={
                  isProcessing ||
                  !language ||
                  (language === "custom" && !customLanguage)
                }
                className="w-full py-4 px-6 bg-[#9C7556] dark:bg-[#3E2E22] text-white rounded-xl font-medium text-lg hover:bg-[#7A5639] dark:hover:bg-[#2C1F16] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Process Page
              </button>
            </>
          )}
        </div>

        <div className="mt-6 text-sm text-gray-500 text-center">
          Supported formats: JPG, PNG, WebP, GIF
        </div>
      </div>
    </div>
  );
};
