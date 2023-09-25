export const scrollToTop = () => {
    if (!document.body.classList.contains('top')) {
        const body = document.getElementById('body');
        if (body) {
            window.requestAnimationFrame(() => {
                body.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
            });
        } else {
            window.requestAnimationFrame(() => {
                window.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
            });
        }
    }
};
