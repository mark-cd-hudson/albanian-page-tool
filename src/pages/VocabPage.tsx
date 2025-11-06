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

interface VocabPageProps {
  selectedLanguage: string;
}

export const VocabPage: React.FC<VocabPageProps> = ({ selectedLanguage }) => {
  const [vocabWords, setVocabWords] = useState<VocabWord[]>([]);
  const [showIgnored, setShowIgnored] = useState(false);
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

  const sortedWords = [...vocabWords].sort((a, b) => {
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

  const activeWords = vocabWords.filter((w) => !w.ignored);
  const ignoredWords = vocabWords.filter((w) => w.ignored);

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Vocabulary</h1>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <div>
            Total Words:{" "}
            <span className="font-semibold text-indigo-600">
              {activeWords.length}
            </span>
          </div>
          <div>
            Ignored:{" "}
            <span className="font-semibold text-gray-400">
              {ignoredWords.length}
            </span>
          </div>
          <div>
            Language:{" "}
            <span className="font-semibold">
              {selectedLanguage === "all" ? "All Languages" : selectedLanguage}
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
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
      <div className="flex flex-wrap gap-4 mb-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showIgnored}
            onChange={(e) => setShowIgnored(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">Show ignored words</span>
        </label>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700">Sort by:</label>
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
            className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Word
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Meaning
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Times Seen
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Added
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Next Review
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedWords.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-500"
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
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {word.word}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {word.contexts[0]?.meaning || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {word.contexts.length}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {format(new Date(word.addedAt), "MMM dd, yyyy")}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {word.fsrsCard?.due
                        ? format(new Date(word.fsrsCard.due), "MMM dd, yyyy")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() =>
                          handleToggleIgnore(word.word, word.language)
                        }
                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
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
