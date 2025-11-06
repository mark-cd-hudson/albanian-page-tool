import React, { useState, useEffect } from "react";
import { indexedDBService } from "../services/indexedDB";
import { VocabWord } from "../types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, subDays } from "date-fns";
import { isMasteredWord } from "../services/fsrs";

interface VocabPageProps {
  selectedLanguage: string;
}

export const VocabPage: React.FC<VocabPageProps> = ({ selectedLanguage }) => {
  const [vocabWords, setVocabWords] = useState<VocabWord[]>([]);
  const [showIgnored, setShowIgnored] = useState(false);
  const [showOnlyMastered, setShowOnlyMastered] = useState(false);
  const [sortField, setSortField] = useState<"word" | "addedAt" | "timesSeen">(
    "addedAt"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    loadVocabWords();
  }, [selectedLanguage, showIgnored]);

  const loadVocabWords = async () => {
    const words = await indexedDBService.getVocabWords(
      selectedLanguage,
      showIgnored
    );
    setVocabWords(words);
  };

  const handleToggleIgnore = async (word: string, language: string) => {
    await indexedDBService.toggleIgnoreWord(word, language);
    loadVocabWords();
  };

  const getChartData = () => {
    // Group words by date added
    const dateGroups = new Map<string, number>();

    vocabWords.forEach((word) => {
      if (word.ignored && !showIgnored) return;

      const date = format(new Date(word.addedAt), "yyyy-MM-dd");
      dateGroups.set(date, (dateGroups.get(date) || 0) + 1);
    });

    // Get last 30 days
    const last30Days = [];
    let cumulative = 0;

    for (let i = 29; i >= 0; i--) {
      const date = format(subDays(new Date(), i), "yyyy-MM-dd");
      const count = dateGroups.get(date) || 0;
      cumulative += count;

      last30Days.push({
        date: format(subDays(new Date(), i), "MMM dd"),
        words: cumulative,
      });
    }

    return last30Days;
  };

  const activeWords = vocabWords.filter((w) => !w.ignored);
  const ignoredWords = vocabWords.filter((w) => w.ignored);
  const masteredWords = activeWords.filter((w) => isMasteredWord(w.fsrsCard));

  // Filter words based on toggles
  const displayWords = showOnlyMastered
    ? vocabWords.filter((w) => !w.ignored && isMasteredWord(w.fsrsCard))
    : vocabWords;

  const sortedWords = [...displayWords].sort((a, b) => {
    let compareA, compareB;

    switch (sortField) {
      case "word":
        compareA = a.word;
        compareB = b.word;
        break;
      case "addedAt":
        compareA = a.addedAt;
        compareB = b.addedAt;
        break;
      case "timesSeen":
        compareA = a.contexts.length;
        compareB = b.contexts.length;
        break;
      default:
        compareA = a.addedAt;
        compareB = b.addedAt;
    }

    if (sortOrder === "asc") {
      return compareA > compareB ? 1 : -1;
    } else {
      return compareA < compareB ? 1 : -1;
    }
  });

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Vocabulary
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Language:{" "}
          <span className="font-semibold">
            {selectedLanguage === "all" ? "All Languages" : selectedLanguage}
          </span>
        </p>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-950 rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Active Words
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {activeWords.length}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-950 rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Mastered Words
            </div>
            <div className="text-2xl font-bold text-green-600">
              {masteredWords.length}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {activeWords.length > 0
                ? `${Math.round(
                    (masteredWords.length / activeWords.length) * 100
                  )}% mastered`
                : "0% mastered"}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-950 rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Ignored Words
            </div>
            <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
              {ignoredWords.length}
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-gray-950 rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Vocabulary Growth
        </h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={getChartData()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="words"
              stroke="#4f46e5"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 mb-4 items-center justify-between">
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showIgnored}
              onChange={(e) => setShowIgnored(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Show ignored words
            </span>
          </label>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700 dark:text-gray-300">
              Sort by:
            </label>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as any)}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="addedAt">Date Added</option>
              <option value="word">Word</option>
              <option value="timesSeen">Times Seen</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowOnlyMastered(!showOnlyMastered)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            showOnlyMastered
              ? "bg-green-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:hover:bg-gray-700"
          }`}
        >
          {showOnlyMastered ? "Show All" : "Show Mastered Only"}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-950 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Word
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Meaning
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Times Seen
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Added
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Next Review
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sortedWords.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    No vocabulary words yet. Start reading to build your
                    vocabulary!
                  </td>
                </tr>
              ) : (
                sortedWords.map((word) => (
                  <tr
                    key={`${word.word}_${word.language}`}
                    className={word.ignored ? "opacity-50" : ""}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {word.word}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {word.contexts[0]?.meaning || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {word.contexts.length}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {format(new Date(word.addedAt), "MMM dd, yyyy")}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {word.fsrsCard?.due
                        ? format(new Date(word.fsrsCard.due), "MMM dd, yyyy")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() =>
                          handleToggleIgnore(word.word, word.language)
                        }
                        className="text-sm text-[#9C7556] dark:text-[#D4A574] hover:text-[#7A5639] dark:hover:text-[#C9A671] font-medium"
                      >
                        {word.ignored ? "Unignore" : "Ignore"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
