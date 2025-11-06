import React, { useState, useEffect } from "react";
import { indexedDBService } from "../services/indexedDB";
import { fsrsService, Rating } from "../services/fsrs";
import type { SchedulingInfo } from "../services/fsrs";
import { VocabWord, ReviewSession, WordReview } from "../types";
import { format } from "date-fns";

interface ReviewPageProps {
  selectedLanguage: string;
}

type CardBucket = "new" | "learning" | "review";

interface CardInQueue extends VocabWord {
  bucket: CardBucket;
}

export const ReviewPage: React.FC<ReviewPageProps> = ({ selectedLanguage }) => {
  const [reviewQueue, setReviewQueue] = useState<CardInQueue[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [contextIndex, setContextIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [schedulingInfo, setSchedulingInfo] = useState<SchedulingInfo[]>([]);

  // Track remaining counts for each bucket
  const newCount = reviewQueue
    .slice(currentIndex)
    .filter((c) => c.bucket === "new").length;
  const learningCount = reviewQueue
    .slice(currentIndex)
    .filter((c) => c.bucket === "learning").length;
  const reviewCount = reviewQueue
    .slice(currentIndex)
    .filter((c) => c.bucket === "review").length;

  useEffect(() => {
    loadWordsToReview();
  }, [selectedLanguage]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showMenu) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showMenu]);

  const loadWordsToReview = async () => {
    const words = await indexedDBService.getWordsDueForReview(selectedLanguage);

    // Categorize cards into new vs review
    let newCards = words
      .filter((w) => !w.fsrsCard || w.fsrsCard.state === 0)
      .map((word) => ({ ...word, bucket: "new" as CardBucket }));

    const reviewCards = words
      .filter((w) => w.fsrsCard && w.fsrsCard.state !== 0)
      .map((word) => ({ ...word, bucket: "review" as CardBucket }));

    // Limit to 20 new cards, prioritizing common words (those with more contexts)
    const MAX_NEW_CARDS = 20;
    if (newCards.length > MAX_NEW_CARDS) {
      // Sort by number of contexts (descending) - more common words first
      newCards.sort((a, b) => b.contexts.length - a.contexts.length);
      newCards = newCards.slice(0, MAX_NEW_CARDS);
    }

    // Shuffle within each bucket
    newCards.sort(() => Math.random() - 0.5);
    reviewCards.sort(() => Math.random() - 0.5);

    setReviewQueue([...newCards, ...reviewCards]);
    setCurrentIndex(0);
    setContextIndex(0);
    setShowAnswer(false);
    setSessionComplete(false);
    setReviewedCount(0);
  };

  const startSession = () => {
    setSessionStartTime(Date.now());
  };

  const handleRating = async (rating: Rating) => {
    const currentCard = reviewQueue[currentIndex];
    if (!currentCard) return;

    // Update FSRS card
    const { card } = fsrsService.reviewWord(currentCard.fsrsCard, rating);
    await indexedDBService.updateVocabCard(
      currentCard.word,
      currentCard.language,
      card
    );

    // Save individual word review
    const wordReview: WordReview = {
      id: `${Date.now()}_${Math.random()}`,
      word: currentCard.word,
      language: currentCard.language,
      rating,
      date: Date.now(),
      reviewedAt: format(new Date(), "yyyy-MM-dd"),
    };
    await indexedDBService.saveWordReview(wordReview);

    // If user clicked "Again", add card back to the queue as a learning card
    if (rating === Rating.Again) {
      const updatedCard: CardInQueue = {
        ...currentCard,
        fsrsCard: card,
        bucket: "learning",
      };

      // Insert back into the queue (after a few cards, not immediately)
      const insertPosition = Math.min(currentIndex + 4, reviewQueue.length);
      const newQueue = [...reviewQueue];
      newQueue.splice(insertPosition, 0, updatedCard);
      setReviewQueue(newQueue);
    }

    // Move to next card
    const nextIndex = currentIndex + 1;
    setReviewedCount(reviewedCount + 1);

    if (nextIndex >= reviewQueue.length) {
      // Session complete
      if (sessionStartTime) {
        const duration = Math.floor((Date.now() - sessionStartTime) / 1000);
        const session: ReviewSession = {
          id: `${Date.now()}_${Math.random()}`,
          language: selectedLanguage,
          date: Date.now(),
          wordCount: reviewQueue.length,
          duration,
        };
        await indexedDBService.saveReviewSession(session);
      }
      setSessionComplete(true);
    } else {
      setCurrentIndex(nextIndex);
      setContextIndex(0);
      setShowAnswer(false);
      setShowMenu(false); // Close menu when moving to next word
    }
  };

  const currentCard = reviewQueue[currentIndex];
  const currentContext = currentCard?.contexts[contextIndex];

  // Helper function to escape regex special characters
  const escapeRegex = (str: string) => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };

  // Helper function to highlight word in sentence
  const highlightWord = (sentence: string, word: string) => {
    // Escape special regex characters
    const escapedWord = escapeRegex(word);
    // Match word optionally followed by punctuation
    // (?<!\S) means "not preceded by a non-whitespace character"
    // [.,!?;:"""'']* matches optional trailing punctuation
    // This works with Unicode characters like ë, ç, etc.
    const regex = new RegExp(
      `((?<!\\S)${escapedWord}[.,!?;:"""'']*(?=\\s|$))`,
      "giu"
    );
    const parts = sentence.split(regex);

    return parts.map((part, i) => {
      // Check if this part matches the word (case-insensitive)
      // Strip common punctuation for comparison
      const cleanPart = part.toLowerCase().replace(/[.,!?;:"""'']/g, "");
      const cleanWord = word.toLowerCase().replace(/[.,!?;:"""'']/g, "");

      if (cleanPart === cleanWord) {
        return (
          <span key={i} className="bg-yellow-200 font-semibold px-1 rounded">
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const handleNextContext = () => {
    if (currentCard && contextIndex < currentCard.contexts.length - 1) {
      setContextIndex(contextIndex + 1);
    }
  };

  const handlePrevContext = () => {
    if (contextIndex > 0) {
      setContextIndex(contextIndex - 1);
    }
  };

  const handleIgnoreWord = async () => {
    const ignoredCard = reviewQueue[currentIndex];
    if (!ignoredCard) return;

    // Ignore the word in the database
    await indexedDBService.toggleIgnoreWord(
      ignoredCard.word,
      ignoredCard.language
    );

    // Remove from current review session
    const updatedQueue = reviewQueue.filter((_, i) => i !== currentIndex);
    setReviewQueue(updatedQueue);

    // Close menu
    setShowMenu(false);

    // If no more words, end session
    if (updatedQueue.length === 0) {
      if (sessionStartTime) {
        const duration = Math.floor((Date.now() - sessionStartTime) / 1000);
        const session: ReviewSession = {
          id: `${Date.now()}_${Math.random()}`,
          language: selectedLanguage,
          date: Date.now(),
          wordCount: reviewedCount,
          duration,
        };
        await indexedDBService.saveReviewSession(session);
      }
      setSessionComplete(true);
    } else {
      // Reset for next word (stay at same index, which now has a new word)
      setContextIndex(0);
      setShowAnswer(false);
    }
  };

  if (reviewQueue.length === 0 && !sessionComplete) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          All Caught Up!
        </h1>
        <p className="text-gray-600 mb-6">
          No words due for review right now. Great job!
        </p>
        <button
          onClick={loadWordsToReview}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Check Again
        </button>
      </div>
    );
  }

  if (!sessionStartTime && !sessionComplete) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="text-6xl mb-4">📚</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Ready to Review?
        </h1>
        <p className="text-gray-600 mb-6">
          You have{" "}
          <span className="font-bold text-indigo-600">
            {reviewQueue.length}
          </span>{" "}
          word{reviewQueue.length !== 1 ? "s" : ""} due for review.
        </p>
        <button
          onClick={startSession}
          className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-lg font-medium"
        >
          Start Review
        </button>
      </div>
    );
  }

  if (sessionComplete) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="text-6xl mb-4">✨</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Session Complete!
        </h1>
        <p className="text-gray-600 mb-6">
          You reviewed{" "}
          <span className="font-bold text-indigo-600">{reviewedCount}</span>{" "}
          word{reviewedCount !== 1 ? "s" : ""}.
        </p>
        <button
          onClick={loadWordsToReview}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Review Again
        </button>
      </div>
    );
  }

  if (!currentCard || !currentContext) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Progress Bar */}
      <div className="bg-gray-100 p-4 border-b">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>
              {currentIndex + 1} / {reviewQueue.length}
            </span>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all"
              style={{
                width: `${((currentIndex + 1) / reviewQueue.length) * 100}%`,
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Review Card */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-lg shadow-lg p-6 lg:p-8 relative">
            {/* Three-dot menu */}
            <div className="absolute top-4 right-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Options"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>

              {/* Dropdown menu */}
              {showMenu && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleIgnoreWord();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
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
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                    Ignore this word
                  </button>
                </div>
              )}
            </div>

            {/* Context Navigation */}
            {currentCard.contexts.length > 1 && (
              <div className="flex justify-between items-center mb-4 text-sm text-gray-500">
                <button
                  onClick={handlePrevContext}
                  disabled={contextIndex === 0}
                  className="px-3 py-1 border rounded disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  ← Prev
                </button>
                <span>
                  Example {contextIndex + 1} of {currentCard.contexts.length}
                </span>
                <button
                  onClick={handleNextContext}
                  disabled={contextIndex === currentCard.contexts.length - 1}
                  className="px-3 py-1 border rounded disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next →
                </button>
              </div>
            )}

            {/* Clickable card area */}
            <div
              onClick={() => {
                if (!showAnswer) {
                  const info = fsrsService.getSchedulingInfo(
                    currentCard.fsrsCard
                  );
                  setSchedulingInfo(info);
                  setShowAnswer(true);
                }
              }}
              className={!showAnswer ? "cursor-pointer" : ""}
            >
              {/* Word being studied */}
              <div className="mb-6 text-center">
                <div className="text-3xl lg:text-4xl font-bold text-indigo-600">
                  {currentCard.word}
                </div>
              </div>

              {/* Sentence with highlighted word */}
              <div className="mb-6">
                <div className="text-sm text-gray-500 uppercase mb-2">
                  Example Sentence
                </div>
                <div className="text-xl lg:text-2xl text-gray-800 leading-relaxed">
                  {highlightWord(currentContext.sentenceText, currentCard.word)}
                </div>
              </div>
            </div>

            {/* Answer */}
            {showAnswer && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="mb-3">
                  <div className="text-sm font-semibold text-gray-500 uppercase mb-1">
                    Word Meaning
                  </div>
                  <div className="text-lg text-gray-900">
                    {currentContext.meaning}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-500 uppercase mb-1">
                    Sentence Translation
                  </div>
                  <div className="text-lg text-gray-900">
                    {currentContext.sentenceTranslation}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section - Conditional */}
      {sessionStartTime && (
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <div className="max-w-3xl mx-auto">
            {!showAnswer ? (
              // Card Front: Show bucket counts
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-blue-600">
                    {newCount}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">New</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-red-600">
                    {learningCount}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Again</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600">
                    {reviewCount}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Review</div>
                </div>
              </div>
            ) : (
              // Card Back: Show rating buttons with intervals
              <div className="grid grid-cols-4 gap-2">
                {schedulingInfo.map((info) => {
                  const buttonClass =
                    info.rating === Rating.Again
                      ? "bg-red-100 text-red-700 hover:bg-red-200"
                      : info.rating === Rating.Hard
                      ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                      : info.rating === Rating.Good
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-blue-100 text-blue-700 hover:bg-blue-200";

                  const label =
                    info.rating === Rating.Again
                      ? "Again"
                      : info.rating === Rating.Hard
                      ? "Hard"
                      : info.rating === Rating.Good
                      ? "Good"
                      : "Easy";

                  return (
                    <button
                      key={info.rating}
                      onClick={() => handleRating(info.rating)}
                      className={`py-3 rounded-lg font-medium ${buttonClass} flex flex-col items-center justify-center`}
                    >
                      <span className="font-semibold">{label}</span>
                      <span className="text-xs opacity-75 mt-1">
                        {info.interval}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
