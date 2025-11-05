import { PageData, AppSettings } from '../types';

const PAGES_KEY = 'albanian_pages';
const SETTINGS_KEY = 'albanian_settings';
const IMAGE_KEY_PREFIX = 'albanian_page_image_';

export const storageService = {
  // Settings
  getSettings(): AppSettings | null {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? JSON.parse(data) : null;
  },

  saveSettings(settings: AppSettings): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  },

  // Image storage helpers
  saveImage(pageId: string, imageDataUrl: string): void {
    try {
      localStorage.setItem(`${IMAGE_KEY_PREFIX}${pageId}`, imageDataUrl);
    } catch (error) {
      console.error('Failed to store image for page', pageId, error);
    }
  },

  getImage(pageId: string): string | null {
    return localStorage.getItem(`${IMAGE_KEY_PREFIX}${pageId}`);
  },

  deleteImage(pageId: string): void {
    localStorage.removeItem(`${IMAGE_KEY_PREFIX}${pageId}`);
  },

  // Pages
  getPages(): PageData[] {
    const data = localStorage.getItem(PAGES_KEY);
    if (!data) return [];
    
    const pages = JSON.parse(data);
    // Convert words back to Map and load images from separate storage
    return pages.map((page: any) => ({
      ...page,
      imageDataUrl: this.getImage(page.id), // Load image from separate key
      paragraphs: (page.paragraphs || []).map((paragraph: any) => ({
        sentences: (paragraph.sentences || []).map((sentence: any) => ({
          ...sentence,
          words: new Map(Object.entries(sentence.words || {}))
        }))
      })),
      // Handle old format for backward compatibility
      ...(page.sentences && !page.paragraphs ? {
        paragraphs: [{
          sentences: page.sentences.map((sentence: any) => ({
            ...sentence,
            words: new Map(Object.entries(sentence.words || {}))
          }))
        }]
      } : {})
    }));
  },

  savePage(page: PageData): void {
    const pages = this.getPages();
    
    // Remove old pages beyond limit and delete their images
    const pagesToRemove = pages.slice(20); // Keep only 20 most recent
    pagesToRemove.forEach(p => this.deleteImage(p.id));
    
    pages.unshift(page);
    
    // Limit to 20 most recent pages to avoid storage issues
    const limitedPages = pages.slice(0, 20);
    
    // Store image separately if it exists
    if (page.imageDataUrl) {
      this.saveImage(page.id, page.imageDataUrl);
    }
    
    // Convert Maps to objects for storage and remove image data from main storage
    const serializedPages = limitedPages.map(p => ({
      ...p,
      imageDataUrl: undefined, // Store images separately
      paragraphs: p.paragraphs.map(para => ({
        sentences: para.sentences.map(s => ({
          ...s,
          words: Object.fromEntries(s.words)
        }))
      }))
    }));
    
    localStorage.setItem(PAGES_KEY, JSON.stringify(serializedPages));
  },

  getPage(id: string): PageData | null {
    const pages = this.getPages();
    return pages.find(p => p.id === id) || null;
  },

  deletePage(id: string): void {
    // Delete the image
    this.deleteImage(id);
    
    // Delete the page data
    const pages = this.getPages().filter(p => p.id !== id);
    const serializedPages = pages.map(p => ({
      ...p,
      imageDataUrl: undefined, // Images stored separately
      paragraphs: p.paragraphs.map(para => ({
        sentences: para.sentences.map(s => ({
          ...s,
          words: Object.fromEntries(s.words)
        }))
      }))
    }));
    localStorage.setItem(PAGES_KEY, JSON.stringify(serializedPages));
  }
};

