"use client"
import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already installed or dismissed this session
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (sessionStorage.getItem('tt_install_dismissed')) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt after 30s of engagement
      setTimeout(() => setShow(true), 30000);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShow(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    sessionStorage.setItem('tt_install_dismissed', '1');
  };

  if (!show || dismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9998] px-4 pb-[max(16px,env(safe-area-inset-bottom,16px))] animate-in slide-in-from-bottom-4 duration-400">
      <div className="rounded-2xl px-4 py-3 flex items-center gap-3 max-w-sm mx-auto"
        style={{ background: 'rgba(13,17,23,0.98)', border: '1px solid rgba(251,177,60,0.25)', backdropFilter: 'blur(20px)' }}>
        <div className="text-2xl flex-shrink-0">🏟️</div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-headline font-black uppercase text-white">Add to Home Screen</div>
          <div className="text-[9px] font-code text-white/40 mt-0.5">Play offline · No App Store needed</div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={handleDismiss} className="text-[9px] font-code text-white/30 px-2 py-1">Not now</button>
          <button onClick={handleInstall}
            className="text-[9px] font-code font-bold uppercase tracking-wide px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(251,177,60,0.15)', color: '#FBB13C', border: '1px solid rgba(251,177,60,0.3)' }}>
            Install
          </button>
        </div>
      </div>
    </div>
  );
}
