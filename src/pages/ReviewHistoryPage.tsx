import React, { useState, useEffect } from "react";
import { indexedDBService } from "../services/indexedDB";
import { WordReview } from "../types";
import { format } from "date-fns";

interface ReviewHistoryPageProps {
  selectedLanguage: string;
}

const getRatingLabel = (rating: number): string => {
  const labels = ["", "Again", "Hard", "Good", "Easy"];
  return labels[rating] || "Unknown";
};

const getRatingColor = (rating: number): string => {
  const colors = [
    "",
    "text-red-600 bg-red-50",
    "text-orange-600 bg-orange-50",
    "text-green-600 bg-green-50",
    "text-blue-600 bg-blue-50",
  ];
  return colors[rating] || "";
};

export const ReviewHistoryPage: React.FC<ReviewHistoryPageProps> = ({
  selectedLanguage,
}) => {
  const [reviews, setReviews] = useState<WordReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, [selectedLanguage]);

  const loadReviews = async () => {
    setLoading(true);
    const data = await indexedDBService.getWordReviews(selectedLanguage, 100);
    setReviews(data);
    setLoading(false);
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Review History</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Word
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Language
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Rating
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reviews.map((review) => (
              <tr key={review.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {format(new Date(review.date), "MMM dd, yyyy HH:mm")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {review.word}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {review.language}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${getRatingColor(
                      review.rating
                    )}`}
                  >
                    {getRatingLabel(review.rating)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {reviews.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No review history yet. Start reviewing to see your progress!
          </div>
        )}
      </div>
    </div>
  );
};
