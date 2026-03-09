// Lightweight in-app sync event bus — no native modules, works in Expo Go.
// syncQueue emits when a card finishes syncing; HomeScreen listens and shows a toast.

type SyncListener = (recipeTitle: string) => void;

const listeners: SyncListener[] = [];

export function onSyncComplete(fn: SyncListener): () => void {
  listeners.push(fn);
  return () => {
    const i = listeners.indexOf(fn);
    if (i >= 0) listeners.splice(i, 1);
  };
}

export function emitSyncComplete(recipeTitle: string): void {
  listeners.forEach(fn => fn(recipeTitle));
}
