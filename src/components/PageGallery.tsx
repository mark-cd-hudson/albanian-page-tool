import React from "react";
import { PageData } from "../types";

interface PageGalleryProps {
  currentPage: PageData;
  allPages: PageData[];
  onSelectPage: (page: PageData) => void;
  onImageClick: () => void;
}

export const PageGallery: React.FC<PageGalleryProps> = ({
  currentPage,
  allPages,
  onSelectPage,
  onImageClick,
}) => {
  if (!currentPage.bookId || !currentPage.pageNumber) {
    // Just show current page if not part of a book or no page number
    return (
      <div className="flex items-center gap-2">
        {currentPage.imageDataUrl && (
          <button
            onClick={onImageClick}
            className="relative hover:opacity-90 transition-opacity"
          >
            <img
              src={currentPage.imageDataUrl}
              alt="Current page"
              className="h-12 w-auto rounded shadow-md object-contain"
            />
          </button>
        )}
      </div>
    );
  }

  // Find prev and next pages in the same book
  const bookPages = allPages
    .filter((p) => p.bookId === currentPage.bookId && p.pageNumber)
    .sort((a, b) => (a.pageNumber || 0) - (b.pageNumber || 0));

  const currentIndex = bookPages.findIndex((p) => p.id === currentPage.id);
  const prevPage = currentIndex > 0 ? bookPages[currentIndex - 1] : null;
  const nextPage =
    currentIndex < bookPages.length - 1 ? bookPages[currentIndex + 1] : null;

  return (
    <div className="flex items-center gap-2">
      {/* Previous Page */}
      {prevPage && prevPage.imageDataUrl ? (
        <button
          onClick={() => onSelectPage(prevPage)}
          className="relative hover:scale-105 transition-transform opacity-50 hover:opacity-100"
          title={`Page ${prevPage.pageNumber}`}
        >
          <img
            src={prevPage.imageDataUrl}
            alt={`Page ${prevPage.pageNumber}`}
            className="h-10 w-auto rounded shadow-sm object-contain"
          />
          <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 bg-black bg-opacity-75 text-white text-[10px] px-1.5 py-0.5 rounded">
            {prevPage.pageNumber}
          </div>
        </button>
      ) : null}

      {/* Current Page */}
      {currentPage.imageDataUrl && (
        <button
          onClick={onImageClick}
          className="relative hover:opacity-90 transition-opacity"
        >
          <img
            src={currentPage.imageDataUrl}
            alt={`Page ${currentPage.pageNumber}`}
            className="h-12 w-auto rounded shadow-md object-contain"
          />
          <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs px-2 py-0.5 rounded">
            {currentPage.pageNumber}
          </div>
        </button>
      )}

      {/* Next Page */}
      {nextPage && nextPage.imageDataUrl ? (
        <button
          onClick={() => onSelectPage(nextPage)}
          className="relative hover:scale-105 transition-transform opacity-50 hover:opacity-100"
          title={`Page ${nextPage.pageNumber}`}
        >
          <img
            src={nextPage.imageDataUrl}
            alt={`Page ${nextPage.pageNumber}`}
            className="h-10 w-auto rounded shadow-sm object-contain"
          />
          <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 bg-black bg-opacity-75 text-white text-[10px] px-1.5 py-0.5 rounded">
            {nextPage.pageNumber}
          </div>
        </button>
      ) : null}
    </div>
  );
};
