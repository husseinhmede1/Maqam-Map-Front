import { useCallback } from 'react';
import { useTranslation } from './useTranslation';
import { useToast } from '@/shared/ui/toast-store';

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}

/**
 * Opens a link in a new tab, and — when the browser blocks that (embedded
 * webviews, aggressive popup blockers) — copies it instead and says so, rather
 * than failing silently.
 */
export function useExternalLink() {
  const { t } = useTranslation();
  const showToast = useToast((state) => state.show);

  return useCallback(
    (url: string, event?: { preventDefault: () => void }) => {
      event?.preventDefault();
      let opened: Window | null = null;
      try {
        opened = window.open(url, '_blank', 'noopener');
      } catch {
        opened = null;
      }
      if (opened) return;

      void copyToClipboard(url).then((copied) => {
        showToast(copied ? t.player.copied : t.player.copyFailed);
      });
    },
    [showToast, t.player.copied, t.player.copyFailed],
  );
}
