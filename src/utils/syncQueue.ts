import { RecipeData } from '../components/RecipeCard';
import { emitSyncComplete } from './notifications';
import { getDrafts, syncToCloud } from './storage';

let retrying = false;

/**
 * Finds all locally-published cards whose cloud sync is still pending and
 * retries uploading them. Fires a local notification for each card that
 * successfully syncs. Safe to call on every app foreground event — it is
 * a no-op when no pending cards exist or when a retry is already in flight.
 */
export async function retryPendingSyncs(): Promise<void> {
  if (retrying) return;
  retrying = true;
  try {
    const drafts: RecipeData[] = await getDrafts();
    const pending = drafts.filter(
      d => d.status === 'published' && d.cloudSyncStatus === 'pending' && !d.isReceived,
    );

    for (const recipe of pending) {
      try {
        await syncToCloud(recipe);
        emitSyncComplete(recipe.title || 'Your recipe');
      } catch {
        // Still offline or Supabase unavailable — stays pending, will retry next foreground
      }
    }
  } finally {
    retrying = false;
  }
}
