import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Book } from "../types";
import { compressImage } from "../utils/imageCompression";

interface BooksPageProps {
  books: Book[];
  onCreateBook: (book: Omit<Book, "id" | "createdAt">) => Promise<string>;
  onDeleteBook: (
    bookId: string,
    action: "delete" | "orphan" | "reassign",
    newBookId?: string
  ) => Promise<void>;
  getPageCountForBook: (bookId: string) => number;
}

export const BooksPage: React.FC<BooksPageProps> = ({
  books,
  onCreateBook,
  onDeleteBook,
  getPageCountForBook,
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleteBookId, setDeleteBookId] = useState<string | null>(null);
  const [deleteAction, setDeleteAction] = useState<
    "delete" | "orphan" | "reassign"
  >("orphan");
  const [reassignBookId, setReassignBookId] = useState<string>("");

  const bookToDelete = books.find((b) => b.id === deleteBookId);
  const pagesCount = deleteBookId ? getPageCountForBook(deleteBookId) : 0;

  const handleDeleteConfirm = async () => {
    if (!deleteBookId) return;
    await onDeleteBook(deleteBookId, deleteAction, reassignBookId || undefined);
    setDeleteBookId(null);
    setDeleteAction("orphan");
    setReassignBookId("");
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Books</h1>
            <p className="text-gray-600 mt-1">Manage your book collection</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            + Add Book
          </button>
        </div>

        {/* Books Grid */}
        {books.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
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
            <p className="text-gray-600">No books yet</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Create your first book
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => {
              const pageCount = getPageCountForBook(book.id);
              return (
                <div
                  key={book.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <Link to={`/books/${book.id}`} className="block">
                    <div className="flex gap-4 mb-3">
                      {book.coverImageUrl ? (
                        <img
                          src={book.coverImageUrl}
                          alt={book.title}
                          className="w-16 h-20 object-cover rounded shadow-sm"
                        />
                      ) : (
                        <div className="w-16 h-20 bg-gray-100 rounded flex items-center justify-center">
                          <svg
                            className="w-8 h-8 text-gray-400"
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
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {book.title}
                        </h3>
                        {book.author && (
                          <p className="text-sm text-gray-600 truncate">
                            by {book.author}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {book.language}
                        </p>
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-sm text-gray-600">
                      {pageCount} {pageCount === 1 ? "page" : "pages"}
                    </span>
                    <button
                      onClick={() => setDeleteBookId(book.id)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create Book Modal */}
        {showCreateForm && (
          <CreateBookModal
            onClose={() => setShowCreateForm(false)}
            onSubmit={async (bookData) => {
              await onCreateBook(bookData);
              setShowCreateForm(false);
            }}
          />
        )}

        {/* Delete Book Modal */}
        {deleteBookId && bookToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Delete "{bookToDelete.title}"?
              </h2>
              {pagesCount > 0 && (
                <div className="mb-4">
                  <p className="text-gray-700 mb-3">
                    This book has {pagesCount}{" "}
                    {pagesCount === 1 ? "page" : "pages"}. What would you like
                    to do with {pagesCount === 1 ? "it" : "them"}?
                  </p>
                  <div className="space-y-2">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="deleteAction"
                        value="orphan"
                        checked={deleteAction === "orphan"}
                        onChange={(e) =>
                          setDeleteAction(e.target.value as "orphan")
                        }
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium text-gray-900">
                          Keep pages without book
                        </div>
                        <div className="text-sm text-gray-600">
                          Pages will remain but won't be linked to any book
                        </div>
                      </div>
                    </label>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="deleteAction"
                        value="delete"
                        checked={deleteAction === "delete"}
                        onChange={(e) =>
                          setDeleteAction(e.target.value as "delete")
                        }
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium text-gray-900">
                          Delete all pages
                        </div>
                        <div className="text-sm text-gray-600">
                          Permanently delete all pages in this book
                        </div>
                      </div>
                    </label>
                    {books.filter((b) => b.id !== deleteBookId).length > 0 && (
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="deleteAction"
                          value="reassign"
                          checked={deleteAction === "reassign"}
                          onChange={(e) =>
                            setDeleteAction(e.target.value as "reassign")
                          }
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            Move to another book
                          </div>
                          {deleteAction === "reassign" && (
                            <select
                              value={reassignBookId}
                              onChange={(e) =>
                                setReassignBookId(e.target.value)
                              }
                              className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            >
                              <option value="">Select a book...</option>
                              {books
                                .filter((b) => b.id !== deleteBookId)
                                .map((book) => (
                                  <option key={book.id} value={book.id}>
                                    {book.title}
                                  </option>
                                ))}
                            </select>
                          )}
                        </div>
                      </label>
                    )}
                  </div>
                </div>
              )}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setDeleteBookId(null);
                    setDeleteAction("orphan");
                    setReassignBookId("");
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleteAction === "reassign" && !reassignBookId}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Delete Book
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Create Book Modal Component
interface CreateBookModalProps {
  onClose: () => void;
  onSubmit: (book: Omit<Book, "id" | "createdAt">) => Promise<void>;
}

const CreateBookModal: React.FC<CreateBookModalProps> = ({
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [language, setLanguage] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !language) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        title,
        author: author || undefined,
        language,
        coverImageUrl: coverImageUrl || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCoverImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      const compressed = await compressImage(dataUrl, 400, 0.8);
      setCoverImageUrl(compressed);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Create New Book
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter book title"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Author
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Enter author name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Language *
            </label>
            <input
              type="text"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="e.g., Albanian, Spanish, French"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cover Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverImageChange}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            {coverImageUrl && (
              <img
                src={coverImageUrl}
                alt="Cover preview"
                className="mt-2 max-w-[120px] h-auto rounded border border-gray-200"
              />
            )}
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title || !language}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating..." : "Create Book"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
