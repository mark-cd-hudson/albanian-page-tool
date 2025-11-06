import React, { useRef } from "react";

interface ImageUploadProps {
  onImageSelect: (dataUrl: string) => void;
  isProcessing: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageSelect,
  isProcessing,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      onImageSelect(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#E8D5C4] rounded-full mb-4">
            <svg
              className="w-10 h-10 text-[#9C7556] dark:text-[#8B6F47]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Upload a Page
          </h2>
          <p className="text-gray-600">
            Upload an image of a page from your Albanian book to get started
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={isProcessing}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="w-full py-4 px-6 bg-[#9C7556] dark:bg-[#3E2E22] text-white rounded-xl font-medium text-lg hover:bg-[#7A5639] dark:hover:bg-[#2C1F16] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Processing...
            </span>
          ) : (
            "Choose Image"
          )}
        </button>

        <div className="mt-6 text-sm text-gray-500 text-center">
          Supported formats: JPG, PNG, WebP, GIF
        </div>
      </div>
    </div>
  );
};
