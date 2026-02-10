declare global {
  interface Window {
    electronAPI: {
      getScreenSize: () => Promise<{ width: number; height: number }>;
      onShowNotes: (callback: () => void) => void;
      onHideNotes: (callback: () => void) => void;
      removeAllListeners: (channel: string) => void;
      setIgnoreMouse: (ignore: boolean) => void;
      hideWindow: () => void;
    };
  }
}

export {};
