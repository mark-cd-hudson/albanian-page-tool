# Albanian Page Tool

A React SPA for learning Albanian by reading books. Upload images of book pages and get instant translations and word meanings.

## Features

- 📷 **Image Upload**: Upload images of Albanian book pages
- 🤖 **AI-Powered Extraction**: Uses Claude AI to extract text from images
- 🔤 **Word-by-Word Translation**: Get meanings for every word in context
- 💬 **Sentence Translation**: See full sentence translations
- 📚 **Page History**: Keep track of all uploaded pages
- 💾 **Local Storage**: All data stored locally in your browser
- 🔑 **Custom API Key**: Use your own Anthropic API key
- 🎨 **Modern UI**: Clean, beautiful, and responsive design

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- An Anthropic API key ([Get one here](https://console.anthropic.com/))

### Installation

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open your browser to the URL shown in the terminal (typically `http://localhost:5173`)

4. Click the settings icon and enter your Anthropic API key

### Usage

1. **Set up your API key**: Click the settings icon in the top right and enter your Anthropic API key
2. **Upload an image**: Click "Choose Image" and select a photo of a book page
3. **Wait for processing**: The app will extract text, translate sentences, and analyze words
4. **Tap words**: Click on any word to see its meaning and sentence translation in a bottom sheet
5. **View history**: Access previously uploaded pages from the sidebar

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Technology Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Anthropic Claude API** for AI processing
  - Claude Sonnet 4.5 for image text extraction
  - Claude Haiku 4.5 for translations (faster and more cost-effective)
- **Local Storage** for data persistence

## Notes

- All data is stored locally in your browser using **IndexedDB**
- Your API key is never sent anywhere except to Anthropic
- **Page images are automatically compressed** - images are resized to 800px width and compressed to reduce storage usage
- IndexedDB provides generous storage limits (hundreds of MB to GBs depending on browser)
- The app keeps up to 50 most recent pages
- For production use, consider implementing a backend proxy to avoid exposing API keys in the browser

## License

MIT
