# Language Learning Tool

A React SPA for learning any language by reading books. Upload images of book pages and get instant translations and word meanings powered by Google Gemini.

## Features

- 🌍 **Multi-Language Support**: Learn any language with AI-powered translations
- 📷 **Image Upload**: Upload images of book pages in any language
- 🤖 **AI-Powered Extraction**: Uses Google Gemini to extract text from images
- 🔤 **Word-by-Word Translation**: Get meanings for every word in context
- 💬 **Sentence Translation**: See full sentence translations
- 📚 **Book Management**: Organize pages by book with title, author, and page numbers
- 🎯 **Custom Native Language**: Set your preferred translation target language
- 📖 **Page History**: Keep track of all uploaded pages with language tags
- 💾 **IndexedDB Storage**: All data stored locally with generous storage limits
- 🔑 **Custom API Key**: Use your own Google Gemini API key
- 🎨 **Modern UI**: Clean, beautiful, and responsive design

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- A Google Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))

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

4. Click the settings icon and enter your Google Gemini API key

5. (Optional) Set your native language in settings (default is English)

### Usage

1. **Set up your API key**: Click the settings icon in the top right and enter your Google Gemini API key
2. **Configure settings**: Set your native language (the language you want translations in)
3. **Upload an image**: Click "Choose Image" and select a photo of a book page
4. **Select source language**: Choose the language of the book you're reading
5. **(Optional) Add book info**: Create or select a book and specify page number
6. **Wait for processing**: The app will extract text, translate sentences, and analyze words
7. **Tap words**: Click on any word to see its meaning and sentence translation in a bottom sheet
8. **View history**: Access previously uploaded pages from the sidebar, filtered by language

## Deployment

### GitHub Pages

This app is configured for automatic deployment to GitHub Pages:

1. **Automatic Deployment**: Every push to the `main` branch automatically triggers a deployment via GitHub Actions
2. **Manual Deployment**: You can also manually deploy by running:
   ```bash
   npm run deploy
   ```

#### First-time Setup

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**
4. Push to `main` branch or run `npm run deploy`

Your app will be live at: `https://[your-username].github.io/albanian-page-tool/`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Technology Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Google Gemini API** for AI processing
  - Gemini 3.0 Pro for image text extraction, translations and sentence splitting
- **IndexedDB** for data persistence with systematic migration system

## Notes

- All data is stored locally in your browser using **IndexedDB**
- Your API key is never sent anywhere except to Google
- **Page images are automatically compressed** - images are resized to 800px width and compressed to reduce storage usage
- IndexedDB provides generous storage limits (hundreds of MB to GBs depending on browser)
- The app keeps up to 50 most recent pages
- **Database migrations** - Schema changes are handled automatically via a systematic migration system
- For production use, consider implementing a backend proxy to avoid exposing API keys in the browser

## Development

### Database Migrations

The app uses a systematic migration system for IndexedDB schema changes. See [`src/services/migrations/README.md`](src/services/migrations/README.md) for details on how to add new migrations.

## License

MIT
