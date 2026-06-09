// Native coin icon, inlined so every platform (incl. desktop/iOS, which don't self-host static
// assets) bundles it without a remote request or per-app copies. Edit the SVG markup below to
// rebrand; the data URI is derived from it at load time (core is tsc-compiled and can't import
// an .svg file).
const NATIVE_COIN_ICON_SVG =
    `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="none"><rect width="100" height="100" fill="#30a1f5" rx="50"/><rect width="99" height="99" x=".5" y=".5" stroke="#000" stroke-opacity=".06" rx="49.5"/><path fill="#fff" d="M60.41 26.75H39.59c-2.772 0-4.159 0-5.413.388a8.7 8.7 0 0 0-3.028 1.653c-1.005.846-1.754 2.012-3.254 4.344L21.277 43.43c-.99 1.54-1.486 2.311-1.62 3.122-.119.715-.04 1.45.228 2.123.304.764.951 1.411 2.247 2.707l24.59 24.59c1.148 1.148 1.721 1.722 2.383 1.936.582.19 1.208.19 1.79 0 .661-.214 1.235-.788 2.382-1.935l24.591-24.591c1.296-1.296 1.943-1.943 2.247-2.707a4 4 0 0 0 .228-2.123c-.134-.81-.63-1.581-1.62-3.122l-6.618-10.295c-1.5-2.332-2.25-3.498-3.254-4.344a8.7 8.7 0 0 0-3.028-1.653c-1.255-.388-2.64-.388-5.414-.388z"/><path fill="#30a1f5" d="M56.469 34.871c.338-.914 1.631-.914 1.97 0l2.337 6.317c.14.38.44.679.819.82l6.317 2.337c.914.338.914 1.63 0 1.97l-6.317 2.337c-.38.14-.679.44-.82.818l-2.337 6.317c-.338.915-1.631.915-1.97 0l-2.337-6.317a1.39 1.39 0 0 0-.819-.818l-6.316-2.338c-.915-.338-.915-1.631 0-1.97l6.316-2.337c.38-.14.679-.44.82-.819z"/></svg>`;

export const NATIVE_COIN_ICON = `data:image/svg+xml,${encodeURIComponent(NATIVE_COIN_ICON_SVG)}`;
