export function openIosKeyboard(keyboard: string, type = 'text', timerSeconds = 30) {
    const input = document.createElement('input');
    input.setAttribute('type', type);
    input.setAttribute('inputMode', keyboard);
    input.setAttribute('style', 'position: fixed; top: -100px; left: -100px;');
    document.body.appendChild(input);
    input.focus();
    // it's safe to remove the fake input after a 30s timeout

    const clean = () => {
        document.body.removeChild(input);
    };
    setTimeout(clean, timerSeconds * 1000);

    return clean;
}

export function hideIosKeyboard() {
    const activeElement = document.activeElement;
    if (!activeElement) return;
    if ('blur' in activeElement && typeof activeElement.blur === 'function') {
        activeElement.blur();
    }
}
