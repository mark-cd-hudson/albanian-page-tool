import React, { useState, useEffect } from "react";
import { PageUploadForm } from "./components/PageUploadForm";
import { ProcessingScreen } from "./components/ProcessingScreen";
import { TextDisplay } from "./components/TextDisplay";
import { BottomSheet } from "./components/BottomSheet";
import { Sidebar } from "./components/Sidebar";
import { Settings } from "./components/Settings";
import { DatabaseUpgradePrompt } from "./components/DatabaseUpgradePrompt";
import { FullscreenImageViewer } from "./components/FullscreenImageViewer";
import { PageGallery } from "./components/PageGallery";
import { ClaudeService } from "./services/claude";
import { indexedDBService } from "./services/indexedDB";
import { PageData, WordInfo, AppSettings, Book } from "./types";
import { compressImage } from "./utils/imageCompression";
import { DEFAULT_NATIVE_LANGUAGE } from "./constants";

type ProcessingStep =
  | "extracting"
  | "splitting"
  | "translating"
  | "saving"
  | null;

function App() {
  const [settings, setSettings] = useState<AppSettings>({
    apiKey: "",
    nativeLanguage: DEFAULT_NATIVE_LANGUAGE,
    recentLanguages: [],
  });
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState<boolean>(false);
  const [pages, setPages] = useState<PageData[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [currentPage, setCurrentPage] = useState<PageData | null>(null);
  const [selectedWord, setSelectedWord] = useState<WordInfo | null>(null);
  const [processingStep, setProcessingStep] = useState<ProcessingStep>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        await indexedDBService.init();

        const savedSettings = await indexedDBService.getSettings();
        if (savedSettings) {
          setSettings(savedSettings);
        }

        const savedPages = await indexedDBService.getPages();
        setPages(savedPages);
        if (savedPages.length > 0) {
          setCurrentPage(savedPages[0]);
        }

        const savedBooks = await indexedDBService.getBooks();
        setBooks(savedBooks);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    loadData();
  }, []);

  const handleSaveSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    await indexedDBService.saveSettings(newSettings);
  };

  const handleCreateBook = async (
    bookData: Omit<Book, "id" | "createdAt">
  ): Promise<string> => {
    try {
      const newBook: Book = {
        ...bookData,
        id: Date.now().toString(),
        createdAt: Date.now(),
      };
      await indexedDBService.saveBook(newBook);
      const updatedBooks = await indexedDBService.getBooks();
      setBooks(updatedBooks);
      return newBook.id;
    } catch (error: any) {
      if (error.message === "DATABASE_UPGRADE_NEEDED") {
        setShowUpgradePrompt(true);
        throw error;
      }
      throw error;
    }
  };

  const handleDatabaseUpgrade = () => {
    // Close and reopen the database to trigger upgrade
    window.location.reload();
  };

  const handleImageSelect = async (data: {
    dataUrl: string;
    language: string;
    bookId?: string;
    pageNumber?: number;
  }) => {
    if (!settings.apiKey) {
      alert("Please set your Anthropic API key in settings first.");
      setShowSettings(true);
      return;
    }

    try {
      const claudeService = new ClaudeService(settings.apiKey);

      // Step 1: Extract text
      setProcessingStep("extracting");
      const compressedImage = await compressImage(data.dataUrl);
      const paragraphTexts = await claudeService.extractParagraphs(
        data.dataUrl
      );

      if (paragraphTexts.length === 0) {
        alert(
          "No text could be extracted from the image. Please try another image."
        );
        setProcessingStep(null);
        return;
      }

      // Step 2: Split and translate
      setProcessingStep("translating");
      const processedParagraphs =
        await claudeService.processParagraphsConcurrently(
          paragraphTexts,
          data.language,
          settings.nativeLanguage
        );

      // Step 3: Save
      setProcessingStep("saving");
      const newPage: PageData = {
        id: Date.now().toString(),
        imageDataUrl: compressedImage,
        paragraphs: processedParagraphs,
        timestamp: Date.now(),
        originalText: paragraphTexts.join("\n\n"),
        language: data.language,
        bookId: data.bookId,
        pageNumber: data.pageNumber,
      };

      await indexedDBService.savePage(newPage);

      // Update recent languages
      const updatedRecentLanguages = [
        data.language,
        ...settings.recentLanguages.filter((l) => l !== data.language),
      ].slice(0, 5);

      const updatedSettings = {
        ...settings,
        recentLanguages: updatedRecentLanguages,
      };
      setSettings(updatedSettings);
      await indexedDBService.saveSettings(updatedSettings);

      const updatedPages = await indexedDBService.getPages();
      setPages(updatedPages);
      setCurrentPage(updatedPages[0]);
      setProcessingStep(null);
    } catch (error) {
      console.error("Error processing image:", error);
      alert(
        "An error occurred while processing the image. Please check your API key and try again."
      );
      setProcessingStep(null);
    }
  };

  const handleSelectPage = (page: PageData) => {
    setCurrentPage(page);
  };

  const handleDeletePage = async (id: string) => {
    await indexedDBService.deletePage(id);
    const updatedPages = await indexedDBService.getPages();
    setPages(updatedPages);

    if (currentPage?.id === id) {
      setCurrentPage(updatedPages[0] || null);
    }
  };

  const handleNewPage = () => {
    setCurrentPage(null);
  };

  const currentBook = currentPage?.bookId
    ? books.find((b) => b.id === currentPage.bookId) || null
    : null;

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <Sidebar
        pages={pages}
        currentPageId={currentPage?.id || null}
        onSelectPage={handleSelectPage}
        onDeletePage={handleDeletePage}
        onNewPage={handleNewPage}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Book Details or Default Title */}
            <div className="flex items-center gap-3">
              {currentBook ? (
                <>
                  {currentBook.coverImageUrl && (
                    <img
                      src={currentBook.coverImageUrl}
                      alt={currentBook.title}
                      className="h-12 w-auto object-contain rounded shadow-sm"
                    />
                  )}
                  <div>
                    <h1 className="text-lg font-bold text-gray-900">
                      {currentBook.title}
                    </h1>
                    {currentBook.author && (
                      <p className="text-xs text-gray-600">
                        by {currentBook.author}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Language Learning Tool
                  </h1>
                  <p className="text-xs text-gray-600">
                    Learn languages by reading books
                  </p>
                </div>
              )}
            </div>

            {/* Center: Page Gallery */}
            {currentPage && (
              <div className="flex-shrink-0">
                <PageGallery
                  currentPage={currentPage}
                  allPages={pages}
                  onSelectPage={handleSelectPage}
                  onImageClick={() =>
                    currentPage.imageDataUrl &&
                    setFullscreenImage(currentPage.imageDataUrl)
                  }
                />
              </div>
            )}

            {/* Right: Settings Button */}
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              title="Settings"
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
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {processingStep ? (
            <ProcessingScreen step={processingStep} />
          ) : currentPage ? (
            <TextDisplay page={currentPage} onWordClick={setSelectedWord} />
          ) : (
            <PageUploadForm
              onImageSelect={handleImageSelect}
              isProcessing={false}
              recentLanguages={settings.recentLanguages}
              books={books}
              onCreateBook={handleCreateBook}
              defaultLanguage={pages.length > 0 ? pages[0].language : ""}
              defaultBookId={pages.length > 0 ? pages[0].bookId : undefined}
            />
          )}
        </div>
      </div>

      {/* Bottom Sheet */}
      <BottomSheet
        wordInfo={selectedWord}
        onClose={() => setSelectedWord(null)}
      />

      {/* Settings Modal */}
      {showSettings && (
        <Settings
          settings={settings}
          onSaveSettings={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Database Upgrade Prompt */}
      {showUpgradePrompt && (
        <DatabaseUpgradePrompt onReload={handleDatabaseUpgrade} />
      )}

      {/* Fullscreen Image Viewer */}
      {fullscreenImage && (
        <FullscreenImageViewer
          imageUrl={fullscreenImage}
          onClose={() => setFullscreenImage(null)}
        />
      )}
    </div>
  );
}

export default App;
