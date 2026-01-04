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
  const { status, accept } = useCookieConsent();

  // Don't show if user has already made a choice
  if (status !== 'unknown') return null;

  return (
    <div
      className="animate-in slide-in-from-bottom-4 fill-mode-both fixed inset-x-0 bottom-0 z-50 duration-500"
      style={{ animationDelay: '0.5s' }}
    >
      <div className="bg-zinc-950 px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 sm:flex-row sm:gap-4">
          <p className="text-center text-[13px] tracking-[-0.01em] text-zinc-400 sm:text-left sm:text-[14px]">
            By continuing, you agree to our use of cookies to improve your
            experience.
          </p>
          <button
            onClick={accept}
            className="shrink-0 bg-white px-5 py-1.5 text-[13px] font-medium text-zinc-900 transition-colors hover:bg-zinc-100 sm:text-[14px]"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
