import React, { useState, useEffect } from "react";
import { ImageUpload } from "./components/ImageUpload";
import { TextDisplay } from "./components/TextDisplay";
import { BottomSheet } from "./components/BottomSheet";
import { Sidebar } from "./components/Sidebar";
import { Settings } from "./components/Settings";
import { ClaudeService } from "./services/claude";
import { indexedDBService } from "./services/indexedDB";
import { PageData, WordInfo } from "./types";
import { compressImage } from "./utils/imageCompression";

function App() {
  const [apiKey, setApiKey] = useState<string>("");
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [pages, setPages] = useState<PageData[]>([]);
  const [currentPage, setCurrentPage] = useState<PageData | null>(null);
  const [selectedWord, setSelectedWord] = useState<WordInfo | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        await indexedDBService.init();

        const settings = await indexedDBService.getSettings();
        if (settings?.apiKey) {
          setApiKey(settings.apiKey);
        }

        const savedPages = await indexedDBService.getPages();
        setPages(savedPages);
        if (savedPages.length > 0) {
          setCurrentPage(savedPages[0]);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    loadData();
  }, []);

  const handleSaveApiKey = async (newApiKey: string) => {
    setApiKey(newApiKey);
    await indexedDBService.saveSettings({ apiKey: newApiKey });
  };

  const handleImageSelect = async (dataUrl: string) => {
    if (!apiKey) {
      alert("Please set your Anthropic API key in settings first.");
      setShowSettings(true);
      return;
    }

    setIsProcessing(true);
    try {
      const claudeService = new ClaudeService(apiKey);

      // Step 1: Compress image for storage
      const compressedImage = await compressImage(dataUrl);

      // Step 2: Extract paragraphs (use original full-size image for better OCR)
      const paragraphTexts = await claudeService.extractParagraphs(dataUrl);

      if (paragraphTexts.length === 0) {
        alert(
          "No text could be extracted from the image. Please try another image."
        );
        setIsProcessing(false);
        return;
      }

      // Step 3: Process all paragraphs concurrently (each will split into sentences and translate)
      const processedParagraphs =
        await claudeService.processParagraphsConcurrently(paragraphTexts);

      // Step 4: Create and save the page (with compressed image)
      const newPage: PageData = {
        id: Date.now().toString(),
        imageDataUrl: compressedImage,
        paragraphs: processedParagraphs,
        timestamp: Date.now(),
        originalText: paragraphTexts.join("\n\n"),
      };

      await indexedDBService.savePage(newPage);

      const updatedPages = await indexedDBService.getPages();
      setPages(updatedPages);
      setCurrentPage(updatedPages[0]);
    } catch (error) {
      console.error("Error processing image:", error);
      alert(
        "An error occurred while processing the image. Please check your API key and try again."
      );
    } finally {
      setIsProcessing(false);
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
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Albanian Page Tool
            </h1>
            <p className="text-sm text-gray-600">
              Learn Albanian by reading books
            </p>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Settings"
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
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {currentPage ? (
            <TextDisplay page={currentPage} onWordClick={setSelectedWord} />
          ) : (
            <ImageUpload
              onImageSelect={handleImageSelect}
              isProcessing={isProcessing}
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
          apiKey={apiKey}
          onSaveApiKey={handleSaveApiKey}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

export default App;
