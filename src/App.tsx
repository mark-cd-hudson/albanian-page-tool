import { useState, useEffect } from "react";
import {
  HashRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
  Link,
} from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { Settings } from "./components/Settings";
import { DatabaseUpgradePrompt } from "./components/DatabaseUpgradePrompt";
import { FullscreenImageViewer } from "./components/FullscreenImageViewer";
import { BottomSheet } from "./components/BottomSheet";
import { ReaderPage } from "./pages/ReaderPage";
import { BooksPage } from "./pages/BooksPage";
import { BookDetailPage } from "./pages/BookDetailPage";
import { CreatePagePage } from "./pages/CreatePagePage";
import { VocabPage } from "./pages/VocabPage";
import { ReviewPage } from "./pages/ReviewPage";
import { ReviewHistoryPage } from "./pages/ReviewHistoryPage";
import { StatsPage } from "./pages/StatsPage";
import { ProcessingScreen } from "./components/ProcessingScreen";
import { PageGallery } from "./components/PageGallery";
import { ClaudeService } from "./services/claude";
import { indexedDBService } from "./services/indexedDB";
import { fsrsService } from "./services/fsrs";
import { PageData, WordInfo, AppSettings, Book, VocabContext } from "./types";
import { compressImage } from "./utils/imageCompression";
import { hashString } from "./utils/hash";
import { DEFAULT_NATIVE_LANGUAGE } from "./constants";

type ProcessingStep =
  | "extracting"
  | "splitting"
  | "translating"
  | "saving"
  | null;

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [settings, setSettings] = useState<AppSettings>({
    apiKey: "",
    nativeLanguage: DEFAULT_NATIVE_LANGUAGE,
    recentLanguages: [],
    selectedLanguage: "all",
    darkMode: false,
  });
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState<boolean>(false);
  const [pages, setPages] = useState<PageData[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [currentPage, setCurrentPage] = useState<PageData | null>(null);
  const [selectedWord, setSelectedWord] = useState<WordInfo | null>(null);
  const [processingStep, setProcessingStep] = useState<ProcessingStep>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(
    typeof window !== "undefined" ? window.innerWidth >= 1024 : true
  );
  const [dueCount, setDueCount] = useState<number>(0);

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

  // Load due count when language changes
  useEffect(() => {
    const loadDueCount = async () => {
      const dueWords = await indexedDBService.getWordsDueForReview(
        settings.selectedLanguage
      );
      setDueCount(dueWords.length);
    };
    loadDueCount();
  }, [settings.selectedLanguage]);

  // Apply dark mode
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [settings.darkMode]);

  const handleSaveSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    await indexedDBService.saveSettings(newSettings);
  };

  const handleLanguageChange = async (language: string) => {
    const newSettings = { ...settings, selectedLanguage: language };
    setSettings(newSettings);
    await indexedDBService.saveSettings(newSettings);
  };

  // Get available languages from pages and books
  const availableLanguages = Array.from(
    new Set([...pages.map((p) => p.language), ...books.map((b) => b.language)])
  ).sort();

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

  const handleDeleteBook = async (
    bookId: string,
    action: "delete" | "orphan" | "reassign",
    newBookId?: string
  ) => {
    // Get all pages for this book
    const bookPages = pages.filter((p) => p.bookId === bookId);

    if (action === "delete") {
      // Delete all pages
      for (const page of bookPages) {
        await indexedDBService.deletePage(page.id);
      }
    } else if (action === "orphan") {
      // Remove book association
      for (const page of bookPages) {
        const updatedPage = { ...page, bookId: undefined };
        await indexedDBService.savePage(updatedPage);
      }
    } else if (action === "reassign" && newBookId) {
      // Reassign to new book
      for (const page of bookPages) {
        const updatedPage = { ...page, bookId: newBookId };
        await indexedDBService.savePage(updatedPage);
      }
    }

    // Delete the book
    await indexedDBService.deleteBook(bookId);

    // Reload data
    const updatedPages = await indexedDBService.getPages();
    setPages(updatedPages);
    const updatedBooks = await indexedDBService.getBooks();
    setBooks(updatedBooks);

    // Clear current page if it was deleted
    if (
      action === "delete" &&
      currentPage &&
      bookPages.some((p) => p.id === currentPage.id)
    ) {
      setCurrentPage(updatedPages[0] || null);
    }
  };

  const handleDatabaseUpgrade = () => {
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

      // Navigate to the new page
      navigate(`/pages/${newPage.id}`);
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

  const handleWordClick = async (
    wordInfo: WordInfo,
    pageId: string,
    pageLanguage: string,
    sentenceText: string,
    sentenceWords: Map<string, WordInfo>
  ) => {
    // Set selected word for bottom sheet
    setSelectedWord(wordInfo);

    // Add ALL words from the sentence to vocabulary
    // (clicking any word means you've read the entire sentence and encountered all words)
    try {
      const seenAt = Date.now();
      const fsrsCard = fsrsService.createCard();
      const sentenceId = hashString(sentenceText);

      // Iterate through all words in the sentence
      for (const [, info] of sentenceWords.entries()) {
        const context: VocabContext = {
          sentenceId,
          sentenceText: sentenceText, // The original sentence text
          sentenceTranslation: info.sentenceTranslation,
          meaning: info.meaning,
          pageId,
          seenAt,
        };

        await indexedDBService.addVocabWord(
          info.word,
          pageLanguage,
          context,
          fsrsCard
        );
      }
    } catch (error) {
      console.error("Error adding words to vocabulary:", error);
    }
  };

  const handleDeletePage = async (id: string) => {
    if (!window.confirm("Delete this page?")) return;

    await indexedDBService.deletePage(id);
    const updatedPages = await indexedDBService.getPages();
    setPages(updatedPages);

    if (currentPage?.id === id) {
      setCurrentPage(updatedPages[0] || null);
    }
  };

  const getPageCountForBook = (bookId: string) => {
    return pages.filter((p) => p.bookId === bookId).length;
  };

  // Get current page from URL if on reader route
  const pageMatch = location.pathname.match(/^\/pages\/(.+)$/);
  const currentPageFromRoute = pageMatch
    ? pages.find((p) => p.id === pageMatch[1])
    : null;
  const displayPage = currentPageFromRoute || currentPage;

  // Render header content based on route
  const renderHeaderContent = () => {
    // Check if on page reader route
    if (pageMatch && displayPage) {
      const pageBook = displayPage.bookId
        ? books.find((b) => b.id === displayPage.bookId)
        : null;

      if (pageBook) {
        return (
          <Link
            to={`/books/${pageBook.id}`}
            className="flex items-center gap-3 min-w-0 hover:opacity-75 transition-opacity"
          >
            {pageBook.coverImageUrl && (
              <img
                src={pageBook.coverImageUrl}
                alt={pageBook.title}
                className="h-10 md:h-12 w-auto object-contain rounded shadow-sm flex-shrink-0"
              />
            )}
            <div className="min-w-0">
              <h1 className="text-base md:text-lg font-bold text-gray-900 truncate">
                {pageBook.title}
              </h1>
              {pageBook.author && (
                <p className="text-xs text-gray-600 truncate hidden sm:block">
                  by {pageBook.author}
                </p>
              )}
            </div>
          </Link>
        );
      }

      return (
        <div className="min-w-0">
          <h1 className="text-lg md:text-xl font-bold text-gray-900 truncate">
            Reading
          </h1>
          <p className="text-xs text-gray-600 hidden sm:block">
            {displayPage.language}
          </p>
        </div>
      );
    }

    // Check if on book detail page (don't make it a link since we're already on that page)
    const bookDetailMatch = location.pathname.match(/^\/books\/(.+)$/);
    if (bookDetailMatch) {
      const bookId = bookDetailMatch[1];
      const book = books.find((b) => b.id === bookId);
      if (book) {
        return (
          <div className="flex items-center gap-3 min-w-0">
            {book.coverImageUrl && (
              <img
                src={book.coverImageUrl}
                alt={book.title}
                className="h-10 md:h-12 w-auto object-contain rounded shadow-sm flex-shrink-0"
              />
            )}
            <div className="min-w-0">
              <h1 className="text-base md:text-lg font-bold text-gray-900 dark:text-white truncate">
                {book.title}
              </h1>
              {book.author && (
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate hidden sm:block">
                  by {book.author}
                </p>
              )}
            </div>
          </div>
        );
      }
    }

    // Books list page
    if (location.pathname === "/books") {
      return (
        <div className="min-w-0">
          <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
            Books
          </h1>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {books.length} {books.length === 1 ? "book" : "books"}
          </p>
        </div>
      );
    }

    // Create page route
    if (location.pathname === "/create-page") {
      return (
        <div className="min-w-0">
          <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
            Add New Page
          </h1>
          <p className="text-xs text-gray-600 dark:text-gray-400 hidden sm:block">
            Upload and process a book page
          </p>
        </div>
      );
    }

    // Vocabulary page
    if (location.pathname === "/vocab") {
      return (
        <div className="min-w-0">
          <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
            Vocabulary
          </h1>
          <p className="text-xs text-gray-600 dark:text-gray-400 hidden sm:block">
            {settings.selectedLanguage === "all"
              ? "All Languages"
              : settings.selectedLanguage}
          </p>
        </div>
      );
    }

    // Review page
    if (location.pathname === "/review") {
      return (
        <div className="min-w-0">
          <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
            Review
          </h1>
          <p className="text-xs text-gray-600 dark:text-gray-400 hidden sm:block">
            {dueCount} word{dueCount !== 1 ? "s" : ""} due
          </p>
        </div>
      );
    }

    // Review History page
    if (location.pathname === "/review-history") {
      return (
        <div className="min-w-0">
          <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
            Review History
          </h1>
          <p className="text-xs text-gray-600 dark:text-gray-400 hidden sm:block">
            {settings.selectedLanguage === "all"
              ? "All Languages"
              : settings.selectedLanguage}
          </p>
        </div>
      );
    }

    // Statistics page
    if (location.pathname === "/stats") {
      return (
        <div className="min-w-0">
          <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
            Statistics
          </h1>
          <p className="text-xs text-gray-600 dark:text-gray-400 hidden sm:block">
            {settings.selectedLanguage === "all"
              ? "All Languages"
              : settings.selectedLanguage}
          </p>
        </div>
      );
    }

    // Default fallback (home page with no specific route)
    return (
      <div className="min-w-0">
        <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">
          Language Learning Tool
        </h1>
        <p className="text-xs text-gray-600 dark:text-gray-400 hidden sm:block">
          Learn languages by reading books
        </p>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-white dark:bg-gray-950 overflow-hidden">
      {/* Sidebar Backdrop (Mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        pages={pages}
        books={books}
        currentPageId={currentPage?.id || null}
        onSelectPage={handleSelectPage}
        onDeletePage={handleDeletePage}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        selectedLanguage={settings.selectedLanguage}
        availableLanguages={availableLanguages}
        onLanguageChange={handleLanguageChange}
        dueCount={dueCount}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 px-4 md:px-6 py-3">
          <div className="flex items-center justify-between gap-2 md:gap-4">
            {/* Left: Hamburger + Book Details or Default Title */}
            <div className="flex items-center gap-3">
              {/* Hamburger Menu Button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
                title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
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
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              {/* Route-specific Header Content */}
              {renderHeaderContent()}
            </div>

            {/* Center: Page Gallery (only on reader page) */}
            {pageMatch && displayPage && (
              <div className="flex flex-shrink-0">
                <PageGallery
                  currentPage={displayPage}
                  allPages={pages}
                  onSelectPage={(page) => {
                    handleSelectPage(page);
                    navigate(`/pages/${page.id}`);
                  }}
                  onImageClick={() =>
                    displayPage.imageDataUrl &&
                    setFullscreenImage(displayPage.imageDataUrl)
                  }
                />
              </div>
            )}

            {/* Right: Dark Mode Toggle and Settings */}
            <div className="flex items-center gap-2">
              {/* Dark Mode Toggle */}
              <button
                onClick={() => {
                  const newSettings = {
                    ...settings,
                    darkMode: !settings.darkMode,
                  };
                  handleSaveSettings(newSettings);
                }}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
                title={settings.darkMode ? "Light mode" : "Dark mode"}
              >
                {settings.darkMode ? (
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
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                ) : (
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
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                )}
              </button>

              {/* Settings Button */}
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
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
          </div>
        </header>

        {/* Content Area - Routes */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-950">
          {processingStep ? (
            <ProcessingScreen step={processingStep} />
          ) : (
            <Routes>
              <Route
                path="/"
                element={
                  <ReaderPage
                    pages={pages}
                    onWordClick={handleWordClick}
                    selectedWord={selectedWord}
                  />
                }
              />
              <Route
                path="/pages/:pageId"
                element={
                  <ReaderPage
                    pages={pages}
                    onWordClick={handleWordClick}
                    selectedWord={selectedWord}
                  />
                }
              />
              <Route
                path="/books"
                element={
                  <BooksPage
                    books={books}
                    onCreateBook={handleCreateBook}
                    onDeleteBook={handleDeleteBook}
                    getPageCountForBook={getPageCountForBook}
                  />
                }
              />
              <Route
                path="/books/:bookId"
                element={
                  <BookDetailPage
                    books={books}
                    pages={pages}
                    onSelectPage={handleSelectPage}
                    onDeletePage={handleDeletePage}
                  />
                }
              />
              <Route
                path="/create-page"
                element={
                  <CreatePagePage
                    onImageSelect={handleImageSelect}
                    isProcessing={false}
                    recentLanguages={settings.recentLanguages}
                    books={books}
                    onCreateBook={handleCreateBook}
                    defaultLanguage={pages.length > 0 ? pages[0].language : ""}
                    defaultBookId={
                      pages.length > 0 ? pages[0].bookId : undefined
                    }
                  />
                }
              />
              <Route
                path="/vocab"
                element={
                  <VocabPage selectedLanguage={settings.selectedLanguage} />
                }
              />
              <Route
                path="/review"
                element={
                  <ReviewPage selectedLanguage={settings.selectedLanguage} />
                }
              />
              <Route
                path="/review-history"
                element={
                  <ReviewHistoryPage
                    selectedLanguage={settings.selectedLanguage}
                  />
                }
              />
              <Route
                path="/stats"
                element={
                  <StatsPage selectedLanguage={settings.selectedLanguage} />
                }
              />
            </Routes>
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

function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}

export default App;
