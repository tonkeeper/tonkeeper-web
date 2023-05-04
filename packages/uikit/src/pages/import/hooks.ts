import { useEffect } from 'react';

export const useKeyboardHeight = () => {
  useEffect(() => {
    let innerHeight = window.innerHeight;

    function resizeHandler(this: VisualViewport) {
      const doc = document.documentElement;
      doc.style.setProperty('--app-height', `${this.height}px`);
    }

    const viewport = window.visualViewport;
    if (viewport) {
      setTimeout(() => resizeHandler.call(viewport), 300);
      viewport.addEventListener('resize', resizeHandler);
    }

    return () => {
      const doc = document.documentElement;
      doc.style.setProperty('--app-height', `${innerHeight}px`);
    };
  }, []);
};
