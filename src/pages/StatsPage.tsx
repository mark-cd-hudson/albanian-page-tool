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

interface StatsPageProps {
  selectedLanguage: string;
}

export const StatsPage: React.FC<StatsPageProps> = ({ selectedLanguage }) => {
  const [vocabCount, setVocabCount] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [streak, setStreak] = useState(0);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);

  useEffect(() => {
    loadStats();
  }, [selectedLanguage]);

  const loadStats = async () => {
    // Get vocab count
    const words = await indexedDBService.getVocabWords(selectedLanguage, false);
    setVocabCount(words.length);

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
    let cumulative = 0;

    for (let i = 29; i >= 0; i--) {
      const date = format(subDays(new Date(), i), "yyyy-MM-dd");
      const stat = dailyStats.find((s) => s.date === date);
      cumulative += stat?.wordsAdded || 0;

      last30Days.push({
        date: format(subDays(new Date(), i), "MMM dd"),
        words: cumulative,
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
    if (count === 0) return "bg-gray-100";
    if (count < 5) return "bg-green-200";
    if (count < 10) return "bg-green-400";
    if (count < 20) return "bg-green-600";
    return "bg-green-800";
  };

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Statistics</h1>
        <p className="text-sm text-gray-600">
          Language:{" "}
          <span className="font-semibold">
            {selectedLanguage === "all" ? "All Languages" : selectedLanguage}
          </span>
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-sm text-gray-500 uppercase mb-1">
            Total Vocabulary
          </div>
          <div className="text-3xl font-bold text-indigo-600">{vocabCount}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-sm text-gray-500 uppercase mb-1">
            Total Reviews
          </div>
          <div className="text-3xl font-bold text-green-600">
            {totalReviews}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-sm text-gray-500 uppercase mb-1">
            Current Streak
          </div>
          <div className="text-3xl font-bold text-orange-600">
            {streak} day{streak !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Activity Heatmap */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
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
        <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-gray-100"></div>
            <div className="w-3 h-3 rounded-sm bg-green-200"></div>
            <div className="w-3 h-3 rounded-sm bg-green-400"></div>
            <div className="w-3 h-3 rounded-sm bg-green-600"></div>
            <div className="w-3 h-3 rounded-sm bg-green-800"></div>
          </div>
          <span>More</span>
        </div>
      </div>

      {/* Review Chart */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
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
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
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
              dataKey="words"
              stroke="#4f46e5"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
