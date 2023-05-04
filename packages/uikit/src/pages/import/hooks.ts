import { useEffect } from 'react';

export const useKeyboardHeight = () => {
  useEffect(() => {
    let height = window.innerHeight;

    function resizeHandler(this: VisualViewport) {
      const doc = document.documentElement;
      doc.style.setProperty('--app-height', `${this.height}px`);
    }

    function blurHandler() {
      const viewport = window.visualViewport;
      if (viewport) {
        viewport.removeEventListener('resize', resizeHandler);
      }
    }

    const viewport = window.visualViewport;
    if (viewport) {
      setTimeout(() => resizeHandler.call(viewport), 300);
      viewport.addEventListener('resize', resizeHandler);
    }

    return () => {
      blurHandler();
    };
  }, []);
};
