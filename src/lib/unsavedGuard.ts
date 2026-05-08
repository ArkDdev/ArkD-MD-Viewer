import { create } from 'zustand';

export type GuardChoice = 'save' | 'discard' | 'cancel';

interface GuardState {
  /**
   * When non-null, the modal is visible. Resolving the promise via this
   * function closes it. Only ever one prompt at a time — if a second
   * destructive action fires while the modal is open, we cancel it
   * immediately (see `confirmDiscard` below).
   */
  resolver: ((choice: GuardChoice) => void) | null;
  setResolver: (resolver: ((choice: GuardChoice) => void) | null) => void;
}

const useGuardStore = create<GuardState>((set) => ({
  resolver: null,
  setResolver: (resolver) => set({ resolver }),
}));

/**
 * Show the "unsaved changes" modal and wait for the user's choice. Returns
 * a promise that resolves with one of:
 *
 *   'save'    — the caller should save first, then proceed
 *   'discard' — the caller should drop changes and proceed
 *   'cancel'  — the caller should abort the destructive action
 *
 * If a guard is already showing and another caller asks for one, the new
 * caller resolves immediately with 'cancel'. This avoids stacked modals
 * and surprise behaviour where a queued action runs after the user dismisses
 * the visible one.
 */
export function confirmDiscard(): Promise<GuardChoice> {
  const state = useGuardStore.getState();
  if (state.resolver) {
    return Promise.resolve('cancel');
  }
  return new Promise<GuardChoice>((resolve) => {
    state.setResolver((choice) => {
      // Clear first so subsequent callers see no modal, even if React's
      // batched update would otherwise delay the visible state change.
      useGuardStore.getState().setResolver(null);
      resolve(choice);
    });
  });
}

/**
 * Hook for the modal UI to read its current state.
 * Returns the resolver (or null if hidden) — calling it with a choice
 * dismisses the modal and unblocks the awaiting caller.
 */
export function useGuardModal() {
  return useGuardStore((s) => s.resolver);
}
