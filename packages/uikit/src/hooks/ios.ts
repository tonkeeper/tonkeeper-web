export function openIosKeyboard(keyboard: string, type = 'text') {
    const input = document.createElement('input');
    input.setAttribute('type', type);
    input.setAttribute('inputMode', keyboard);
    input.setAttribute('style', 'position: fixed; top: -100px; left: -100px;');
    document.body.appendChild(input);
    input.focus();
    // it's safe to remove the fake input after a 30s timeout
    setTimeout(() => {
        document.body.removeChild(input);
    }, 30 * 1000);
}
