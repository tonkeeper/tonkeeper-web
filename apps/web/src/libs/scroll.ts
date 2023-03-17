const preventDefault = (e: TouchEvent) => {
  const target = e.target as HTMLElement | null;
  if (!target?.classList.contains('scrollable')) {
    e.preventDefault();
  }
};

export const disableScroll = () => {
  document.documentElement.className = 'is-locked';
  window.document.body.style.paddingRight = `${getScrollbarWidth()}px`;

  window.document.body.addEventListener('touchmove', preventDefault);
};

export const enableScroll = () => {
  document.documentElement.className = '';
  window.document.body.style.paddingRight = '0px';
  window.document.body.removeEventListener('touchmove', preventDefault);
};

export const getScrollbarWidth = () => {
  // Creating invisible container
  const outer = document.createElement('div');
  outer.style.visibility = 'hidden';
  outer.style.overflow = 'scroll'; // forcing scrollbar to appear
  (outer.style as any).msOverflowStyle = 'scrollbar'; // needed for WinJS apps
  document.body.appendChild(outer);

  // Creating inner element and placing it in the container
  const inner = document.createElement('div');
  outer.appendChild(inner);

  // Calculating difference between container's full width and the child width
  const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;

  // Removing temporary elements from the DOM
  outer.parentNode!.removeChild(outer);

  return scrollbarWidth;
};
