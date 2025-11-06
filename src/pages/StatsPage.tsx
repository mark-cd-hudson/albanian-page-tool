import React, { useState, useEffect } from "react";
import { indexedDBService } from "../services/indexedDB";
import { DailyStats } from "../types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { format, subDays, eachDayOfInterval, startOfDay } from "date-fns";
import { isMasteredWord } from "../services/fsrs";

interface StatsPageProps {
  selectedLanguage: string;
}

export const StatsPage: React.FC<StatsPageProps> = ({ selectedLanguage }) => {
  const [vocabCount, setVocabCount] = useState(0);
  const [masteredVocabCount, setMasteredVocabCount] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [streak, setStreak] = useState(0);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [wordReviewsData, setWordReviewsData] = useState<
    Map<string, Set<string>>
  >(new Map());

  useEffect(() => {
    loadStats();
  }, [selectedLanguage]);

  const loadStats = async () => {
    // Get vocab count
    const words = await indexedDBService.getVocabWords(selectedLanguage, false);
    setVocabCount(words.length);

    // Calculate mastered count
    const masteredCount = words.filter((w) =>
      isMasteredWord(w.fsrsCard)
    ).length;
    setMasteredVocabCount(masteredCount);

    // Get streak
    const streakCount = await indexedDBService.getStreak(selectedLanguage);
    setStreak(streakCount);

    // Get daily stats for last 365 days
    const endDate = new Date();
    const startDate = subDays(endDate, 365);
    const stats = await indexedDBService.getDailyStats(selectedLanguage, {
      start: format(startDate, "yyyy-MM-dd"),
      end: format(endDate, "yyyy-MM-dd"),
    });
    setDailyStats(stats);

    // Calculate total reviews
    const total = stats.reduce((sum, stat) => sum + stat.reviewCount, 0);
    setTotalReviews(total);

    // Get all word reviews and build map of date -> unique words reviewed
    const allReviews = await indexedDBService.getWordReviews(selectedLanguage);
    const dateWordsMap = new Map<string, Set<string>>();

    allReviews.forEach((review) => {
      const dateKey = review.reviewedAt; // YYYY-MM-DD format
      if (!dateWordsMap.has(dateKey)) {
        dateWordsMap.set(dateKey, new Set());
      }
      const wordKey = `${review.word}_${review.language}`;
      dateWordsMap.get(dateKey)!.add(wordKey);
    });

    setWordReviewsData(dateWordsMap);
  };

  const getReviewChartData = () => {
    // Last 30 days
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = format(subDays(new Date(), i), "yyyy-MM-dd");
      const stat = dailyStats.find((s) => s.date === date);

      last30Days.push({
        date: format(subDays(new Date(), i), "MMM dd"),
        reviews: stat?.reviewCount || 0,
      });
    }
    return last30Days;
  };

  const getVocabGrowthData = () => {
    // Last 30 days cumulative
    const last30Days = [];
    let cumulativeTotal = 0;
    let cumulativeMastered = 0;
    const reviewedWords = new Set<string>();

    for (let i = 29; i >= 0; i--) {
      const date = format(subDays(new Date(), i), "yyyy-MM-dd");
      const stat = dailyStats.find((s) => s.date === date);
      cumulativeTotal += stat?.wordsAdded || 0;
      cumulativeMastered += stat?.wordsMastered || 0;

      // Add words reviewed on this date to the cumulative set
      const wordsOnDate = wordReviewsData.get(date);
      if (wordsOnDate) {
        wordsOnDate.forEach((word) => reviewedWords.add(word));
      }

      last30Days.push({
        date: format(subDays(new Date(), i), "MMM dd"),
        total: cumulativeTotal,
        mastered: cumulativeMastered,
        reviewed: reviewedWords.size,
      });
    }

    return last30Days;
  };

  const getActivityHeatmapData = () => {
    // Create array of all days in last 365 days
    const endDate = startOfDay(new Date());
    const startDate = subDays(endDate, 364);
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });

    return allDays.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const stat = dailyStats.find((s) => s.date === dateStr);
      return {
        date: dateStr,
        count: stat?.reviewCount || 0,
      };
    });
  };

  const heatmapData = getActivityHeatmapData();

  // Group heatmap data into weeks
  const weeks: Array<Array<{ date: string; count: number }>> = [];
  for (let i = 0; i < heatmapData.length; i += 7) {
    weeks.push(heatmapData.slice(i, i + 7));
  }

  const getHeatmapColor = (count: number) => {
    if (count === 0) return "bg-gray-100 dark:bg-gray-800";
    if (count < 5) return "bg-green-200";
    if (count < 10) return "bg-green-400";
    if (count < 20) return "bg-green-600";
    return "bg-green-800";
  };

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Statistics
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Language:{" "}
          <span className="font-semibold">
            {selectedLanguage === "all" ? "All Languages" : selectedLanguage}
          </span>
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-950 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Vocabulary
              </p>
              <p className="text-3xl font-bold text-[#9C7556] dark:text-[#D4A574]">{vocabCount}</p>
            </div>
            <div className="p-3 bg-[#E8D5C4] rounded-full">
              <svg
                className="w-8 h-8 text-[#9C7556] dark:text-[#D4A574]"
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
          </div>
        </div>

        <div className="bg-white dark:bg-gray-950 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Mastered Words
              </p>
              <p className="text-3xl font-bold text-green-600">
                {masteredVocabCount}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {vocabCount > 0
                  ? `${Math.round((masteredVocabCount / vocabCount) * 100)}%`
                  : "0%"}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-950 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Reviews
              </p>
              <p className="text-3xl font-bold text-blue-600">{totalReviews}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-950 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Current Streak
              </p>
              <p className="text-3xl font-bold text-orange-600">
                {streak} day{streak !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <svg
                className="w-8 h-8 text-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Heatmap */}
      <div className="bg-white dark:bg-gray-950 rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Review Activity
        </h2>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <div className="flex gap-1">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {week.map((day) => (
                    <div
                      key={day.date}
                      className={`w-3 h-3 rounded-sm ${getHeatmapColor(
                        day.count
                      )}`}
                      title={`${format(new Date(day.date), "MMM dd, yyyy")}: ${
                        day.count
                      } review${day.count !== 1 ? "s" : ""}`}
                    ></div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4 text-xs text-gray-500 dark:text-gray-400">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800"></div>
            <div className="w-3 h-3 rounded-sm bg-green-200"></div>
            <div className="w-3 h-3 rounded-sm bg-green-400"></div>
            <div className="w-3 h-3 rounded-sm bg-green-600"></div>
            <div className="w-3 h-3 rounded-sm bg-green-800"></div>
          </div>
          <span>More</span>
        </div>
      </div>

      {/* Review Chart */}
      <div className="bg-white dark:bg-gray-950 rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Reviews (Last 30 Days)
        </h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={getReviewChartData()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="reviews" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Vocab Growth Chart */}
      <div className="bg-white dark:bg-gray-950 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Vocabulary Growth (Last 30 Days)
        </h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={getVocabGrowthData()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#9C7556"
              name="Total Words"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="reviewed"
              stroke="#F59E0B"
              name="Words Reviewed"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="mastered"
              stroke="#10B981"
              name="Mastered Words"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
