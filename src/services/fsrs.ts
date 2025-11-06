import { fsrs, Card, Rating, ReviewLog, createEmptyCard, generatorParameters } from 'ts-fsrs';

export interface SchedulingInfo {
  rating: Rating;
  interval: string;
  card: Card;
}

class FSRSService {
  private f: ReturnType<typeof fsrs>;

  constructor() {
    // Initialize FSRS with default parameters
    const params = generatorParameters({ enable_fuzz: true });
    this.f = fsrs(params);
  }

  // Create a new card for a word
  createCard(): Card {
    return createEmptyCard();
  }

  // Review a word and get updated card
  reviewWord(card: Card, rating: Rating): { card: Card; log: ReviewLog } {
    const now = new Date();
    const schedulingCards = this.f.repeat(card, now);
    
    // The repeat function returns an iterable
    // Find the item that matches our rating
    for (const item of schedulingCards) {
      if (item.log.rating === rating) {
        return { card: item.card, log: item.log };
      }
    }
    
    // Fallback - should not happen
    throw new Error(`Rating ${rating} not found in scheduling cards`);
  }

  // Get words that are due for review
  getDueWords(vocabWords: Array<{ word: string; language: string; fsrsCard: Card }>): Array<{ word: string; language: string; fsrsCard: Card }> {
    const now = new Date();
    
    return vocabWords.filter(vocabWord => {
      if (!vocabWord.fsrsCard) return false;
      
      const dueDate = new Date(vocabWord.fsrsCard.due);
      return dueDate <= now;
    });
  }

  // Get next review date for a card
  getNextReviewDate(card: Card): Date {
    return new Date(card.due);
  }

  // Get scheduling information for all ratings
  getSchedulingInfo(card: Card): SchedulingInfo[] {
    const now = new Date();
    const schedulingCards = this.f.repeat(card, now);
    const results: SchedulingInfo[] = [];
    
    for (const item of schedulingCards) {
      const interval = this.formatInterval(now, new Date(item.card.due));
      results.push({
        rating: item.log.rating,
        interval,
        card: item.card,
      });
    }
    
    return results;
  }

  // Format time interval in human-readable form
  private formatInterval(from: Date, to: Date): string {
    const diffMs = to.getTime() - from.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 1) return '<1m';
    if (diffMinutes < 60) return `${diffMinutes}m`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d`;
    
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths}mo`;
    
    const diffYears = Math.floor(diffDays / 365);
    return `${diffYears}y`;
  }
}

export const fsrsService = new FSRSService();
export { Rating } from 'ts-fsrs';
export type { Card } from 'ts-fsrs';

