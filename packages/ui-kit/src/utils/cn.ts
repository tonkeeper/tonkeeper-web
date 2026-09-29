export const cn = (...classNames: (string | undefined | boolean)[]) =>
    classNames.filter(Boolean).join(' ');
