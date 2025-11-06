import React from "react";
import { PageData, WordInfo } from "../types";

interface TextDisplayProps {
  page: PageData;
  onWordClick: (
    wordInfo: WordInfo,
    sentenceText: string,
    sentenceWords: Map<string, WordInfo>
  ) => void;
  selectedWord: WordInfo | null;
}

export const TextDisplay: React.FC<TextDisplayProps> = ({
  page,
  onWordClick,
  selectedWord,
}) => {
  const handleWordClick = (word: string, sentence: any) => {
    const cleanWord = word.toLowerCase().replace(/[.,!?;:"""'']/g, "");
    const wordInfo = sentence.words.get(cleanWord);

    if (wordInfo) {
      onWordClick(wordInfo, sentence.text, sentence.words);
    }
  };

  return (
    <div className="h-full overflow-y-auto pb-64">
      {/* Text Content - Continuous */}
      <div className="max-w-4xl mx-auto p-8">
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
                    const isSelected =
                      selectedWord &&
                      selectedWord.word.toLowerCase() === cleanWord &&
                      selectedWord.sentenceTranslation === sentence.translation;

                    return (
                      <span key={`${paragraphIdx}-${sentenceIdx}-${wordIdx}`}>
                        <span
                          onClick={() =>
                            hasInfo && handleWordClick(word, sentence)
                          }
                          className={
                            hasInfo
                              ? `text-indigo-600 cursor-pointer hover:bg-indigo-100 px-1 py-0.5 rounded transition-colors font-medium ${
                                  isSelected ? "bg-indigo-100" : ""
                                }`
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

        {/* Page Number */}
        {page.pageNumber && (
          <div className="mt-8 text-center text-gray-500 text-sm">
            Page {page.pageNumber}
          </div>
        )}
      </div>
    </div>
  );
};
