import React from "react";
import { PageData, WordInfo } from "../types";

interface TextDisplayProps {
  page: PageData;
  onWordClick: (wordInfo: WordInfo) => void;
}

export const TextDisplay: React.FC<TextDisplayProps> = ({
  page,
  onWordClick,
}) => {
  const handleWordClick = (word: string, sentence: any) => {
    const cleanWord = word.toLowerCase().replace(/[.,!?;:"""'']/g, "");
    const wordInfo = sentence.words.get(cleanWord);

    if (wordInfo) {
      onWordClick(wordInfo);
    }
  };

  return (
    <div className="h-full overflow-y-auto pb-64">
      {/* Image Preview - only if available */}
      {page.imageDataUrl && (
        <div className="bg-gray-100 p-4 border-b border-gray-200">
          <img
            src={page.imageDataUrl}
            alt="Uploaded page"
            className="max-w-full h-auto mx-auto rounded-lg shadow-md"
            style={{ maxHeight: "300px" }}
          />
        </div>
      )}

      {/* Text Content - Continuous */}
      <div className="max-w-4xl mx-auto p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Extracted Text
        </h2>

        <div className="text-lg leading-relaxed text-gray-900 space-y-4">
          {page.paragraphs.map((paragraph, paragraphIdx) => (
            <p key={paragraphIdx}>
              {paragraph.sentences.map((sentence, sentenceIdx) => (
                <span key={`${paragraphIdx}-${sentenceIdx}`}>
                  {sentence.text.split(/\s+/).map((word, wordIdx) => {
                    const cleanWord = word
                      .toLowerCase()
                      .replace(/[.,!?;:"""'']/g, "");
                    const hasInfo = sentence.words.has(cleanWord);

                    return (
                      <span key={`${paragraphIdx}-${sentenceIdx}-${wordIdx}`}>
                        <span
                          onClick={() =>
                            hasInfo && handleWordClick(word, sentence)
                          }
                          className={
                            hasInfo
                              ? "text-indigo-600 cursor-pointer hover:bg-indigo-100 px-1 py-0.5 rounded transition-colors font-medium"
                              : ""
                          }
                        >
                          {word}
                        </span>
                        {wordIdx < sentence.text.split(/\s+/).length - 1 && " "}
                      </span>
                    );
                  })}{" "}
                </span>
              ))}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};
