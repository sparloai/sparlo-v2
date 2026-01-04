'use client';

import { useCallback, useSyncExternalStore } from 'react';

const COOKIE_CONSENT_KEY = 'cookie_consent_status';

type ConsentStatus = 'unknown' | 'accepted' | 'rejected';

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function getConsentSnapshot(): ConsentStatus {
  const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
  if (stored === 'accepted' || stored === 'rejected') return stored;
  return 'unknown';
}

function getServerSnapshot(): ConsentStatus {
  return 'unknown';
}

function storeConsent(status: ConsentStatus) {
  localStorage.setItem(COOKIE_CONSENT_KEY, status);
  window.dispatchEvent(new Event('storage'));
}

export function useCookieConsent() {
  const status = useSyncExternalStore(
    subscribe,
    getConsentSnapshot,
    getServerSnapshot,
  );

  const accept = useCallback(() => {
    storeConsent('accepted');
  }, []);

  const reject = useCallback(() => {
    storeConsent('rejected');
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem(COOKIE_CONSENT_KEY);
    window.dispatchEvent(new Event('storage'));
  }, []);

  return {
    status,
    accept,
    reject,
    clear,
  };
}

export function CookieConsentBanner() {
  const { status, accept, reject } = useCookieConsent();

  // Don't show if user has already made a choice
  if (status !== 'unknown') return null;

  return (
    <div
      className="animate-in slide-in-from-bottom-4 fill-mode-both fixed inset-x-0 bottom-0 z-50 p-4 duration-500"
      style={{ animationDelay: '1.5s' }}
    >
      <div className="mx-auto max-w-md rounded-xl border border-zinc-800 bg-zinc-950 px-5 py-4 shadow-2xl">
        <div className="flex flex-col gap-4">
          <p className="text-[14px] leading-relaxed tracking-[-0.01em] text-zinc-300">
            We use cookies to understand how you use Sparlo and improve your
            experience.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={accept}
              className="flex-1 rounded-lg bg-white px-4 py-2 text-[14px] font-medium text-zinc-900 transition-colors hover:bg-zinc-100"
            >
              Accept
            </button>
            <button
              onClick={reject}
              className="rounded-lg px-4 py-2 text-[14px] text-zinc-500 transition-colors hover:text-zinc-300"
            >
              No thanks
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
