import { getStorageItem, setStorageItem } from './storageUtils';
import { openExternalUrl } from './appFunctions';

export const PLAY_STORE_APP_URL =
  'https://play.google.com/store/apps/details?id=app.sshtproject';

const STORAGE_KEY = 'play-store-review-prompt';
const RETRY_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

export interface PlayStoreReviewState {
  completed: boolean;
  lastPromptAt: number | null;
}

function readState(): PlayStoreReviewState {
  const saved = getStorageItem<PlayStoreReviewState>(STORAGE_KEY);
  if (!saved || typeof saved !== 'object') {
    return { completed: false, lastPromptAt: null };
  }
  return {
    completed: saved.completed === true,
    lastPromptAt: typeof saved.lastPromptAt === 'number' ? saved.lastPromptAt : null,
  };
}

function writeState(state: PlayStoreReviewState): void {
  setStorageItem(STORAGE_KEY, state);
}

export function shouldShowPlayStoreReview(): boolean {
  const state = readState();
  if (state.completed) return false;
  if (state.lastPromptAt == null) return true;
  return Date.now() - state.lastPromptAt >= RETRY_AFTER_MS;
}

export function markPlayStoreReviewCompleted(): void {
  writeState({ completed: true, lastPromptAt: Date.now() });
}

export function markPlayStoreReviewDeclined(): void {
  writeState({ completed: false, lastPromptAt: Date.now() });
}

export function openPlayStoreListing(): void {
  openExternalUrl(PLAY_STORE_APP_URL);
}
