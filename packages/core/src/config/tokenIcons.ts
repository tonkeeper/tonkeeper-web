// Inlined for the same reason as the native coin icon in `brand.ts`: every
// platform bundles them, with no remote request and no per-app copies. The
// PNGs are base64 because core is tsc-compiled and can't import image files.

const TRX_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44" fill="none"><circle cx="22" cy="22" r="22" fill="#EF0027"/><path fill="#fff" d="m32.91 16.18-2.7-2.486a3.6 3.6 0 0 0-1.45-.8L13.78 10.13c-.34-.07-.7.04-.94.29l-2.55 2.62a.984.984 0 0 0-.21 1.06l5.94 15.43c.14.36.45.62.83.69l.06.01c.4.05.79-.13 1.04-.46l13.62-17.94 1.34.97-13.43 17.69c-.14.19-.06.46.18.55l1.76.67c.39.15.83.04 1.12-.27l11.32-12.49a1 1 0 0 0 .05-1.27Zm-3.97 1.13-2.91 2.36L24.4 15.4l4.54 1.91Zm.96 2.59-9.08 7.36-2.36-6.16 11.44-1.2ZM18.13 19.83l-2.4-6.25 7.83 2.79-5.43 3.46Z"/></svg>`;

export const TRX_ICON = `data:image/svg+xml,${encodeURIComponent(TRX_ICON_SVG)}`;

export const USDT_TON_ICON =
    'data:image/png;base64,' +
    'iVBORw0KGgoAAAANSUhEUgAAAJAAAACQCAMAAADQmBKKAAACKFBMVEVHcEwAl+oAn+sAl+kAmOoAl+oAj48AmOkAk5MA' +
    'lZUAl+8AlJQAlJQAk5MAmOgAmegAmOkAj48AkpIAn58AmOoAk5MAmOoAl+cAk5MAl+kAkpIAl5cAkpIAmOsAk5MAkZEA' +
    'k5MAkpIAkpIAk5MAl+oAmOoAkpIAk5MAk5MAkpIAkpIAmesAkpIAkpIAk5P///8AmOpArq5YuLjf8fH+/v8ClJSb1vZo' +
    'wvOp29t2x/Pj8/N4yPMppaUTm5sNmZn8/f0ElZVrwMA1qqrX7u4xqKhVt7e84+MIl5fz+vr+///1+/vB5eX4/PzZ7+96' +
    'x8eg19cbn58WnJwQmprr9/dQtbWBysr6/f6x3t6s3NwYnZ2Mzs6Oz8+34eGS0dEQn+wlo6NHsrI4q6stpqbv+Pjo9vbx' +
    '+fkKl5cHlpZnv79MtLTr9/4Gm+uK0Pbt9/cMmJj3+/vM6ekgoaHU7e3l9PRww8M8rKwWoewCmeq34/rh8/1kvr5EsLBz' +
    'xMSJzc2Q0ND9/v8Lneva8Pzm9f1xxvPN6uq64uKm2dmZ1NTI6Ojc8PCk2NgfoKC04OCd1ta/5OSR0/Yco+z1+/4ipu1S' +
    'uvGu3/nw+f6FzvXU7vzG5+eEy8va7+9/yck1ru6i2vip3Pg+rq56yfRlwfMpqe1GtfBBr6/i8vI5r+/G6Psuqu7D5/qk' +
    '2vjQ7PtjwPJcvfGW1fZMt/FsxPMAk5NcurqX09Nfu7ub1NQBk5OV0tIx7kvEAAAAL3RSTlMAYBCA3+8gr9+fIL9ggJBQ' +
    'vxDfEM8wfyBA7+8gf89wcJC/oO/Pn7Cvn49gUM9Qz8birJMAAAiWSURBVHhe7NbLasQwDIbRLrXpIhkKARsSVwt7TNx3' +
    '/3t9vUK3ZshFttRFzhN8RELO0792uVxcmZcYxhF/xjHEZS4vRi1zWvHAmrJu1S0nxgaK2SnVzAE7BYWmKeCQWLqOyjMO' +
    'o+xsc2qcnHFOrX2SZ4iQb7vKBDHK7aYVUbGcW2FUDD/S7Y6GlkHa4whNkXBsmdEYi8bm0YHgALyii+XsOgd0EodTPW/o' +
    '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';

export const USDT_TRC20_ICON =
    'data:image/png;base64,' +
    'iVBORw0KGgoAAAANSUhEUgAAAJAAAACQCAMAAADQmBKKAAACjlBMVEVHcEzvACbvAB/vACfuACbuACfvACcAkpIAj4/v' +
    'ACcAk5MAlZUAl5cAlJQAlJQAk5PvACbuACbvACYAj48AkpIAn5/uACYAk5PuACYAk5MAkpIAk5MAkpIAkZEAk5MAkpIA' +
    'kpIAk5MAlJTuACgAkpIAkpLvACYAk5MAk5MAkpIAkpL////vACdArq5YuLjf8fH//v4ClJQJl5ep29vj8/MNmZn8/f0E' +
    'lZU3q6u84+Pz+vr+///1+/v4/Pxkvr4goaGBysq/5OTZ7+8YnZ393+QSm5svp6copKQWnJzx+fnN6uqJzc1yxMTvAin9' +
    '1dwrpaUxqKjW7u7s9/clo6NQtbUbn59Vt7fq9vbo9fUHlpZrwMCr3NyOz888rKxpv7/3gJP+9vjwDjL7xM37usXV7e37' +
    '/f0zqakMmJj3+/vv+PgQmprl9PRNtLSf1tZ6x8eMzs6y39/3eY3wBizxJkfzO1j+5+v//f3xIEL+7fDxGj75nKvzP1z8' +
    'y9PxHkHG5+dGsbFEsLB8yMgUm5uZ1NRTtraQ0NCh19e34eH3gpX0RGHwCC72Zn7+8PLyIkT1W3T4iJr//Pz3fZH5oa/5' +
    'laXyNFP1VG7+9/n4hZev3d39/v6m2dnc8PC64uJuwsJIs7O139+S0dGc1dW24ODS7OzwETXzOFf5mKj5pbP4jp72Y3z+' +
    '7O/7v8r94ubK6OjZ7u7B5eXd8fGEy8uk2NgRmppaubn6s7/xGDv6q7n2boT/+/v++fr8yNH1a4H5qrf80Nj1X3fxL0/1' +
    'WXL3e5DwFzr92+H+8/XyLEzf8vI+ra37vcf7sb37vsjwFjrzSmb0T2v94+j7vcj2dIn93eIAk5NgvLyX09Ndurqb1NSU' +
    '0tIBk5MXzzyoAAAAK3RSTlMAYBCA3+8g7yCv358gv2CAUL+QEN8QzzB/QH9wz3DPkKDvj7+wUJ+vn2C/kBeOlgAACTJJ' +
    'REFUeF7s1k1qxDAMhuGuhaGLZCgJcacKGFu+/02+/t6m0P2gJLKVLvKc4CUScp7+tcvlElJccx1H/BnHmteYXk5qiWXB' +
    'A0sR36qbFIaCsgSnmlixUXVomip2yanrqGbGbiTBN0fHJTjn6NonzQwTmtuuMsGMpN20MhS+c0sMhetHut3R0DpYewKh' +
    'KTKOTRiNsWlsMzowHIA3dLEeXeeKTvJwqOcV3SyDocejyN7jX5TRWd3Xc0d3xXR/Tr5HAheytScwXHDYeIAITmgwLPR5' +
    'j4jAUfL9AdKxPrQCV1kfmLNJCSI4I8uJ/vz+OuLj/QePPR/f6F9WzaynjSsKwE2VtrSJixqQKkTVNBJVl4NBY+xivGML' +
    'b1jyDsYGnhgSsxj/AqApy1/IhEBNeE7SqPkP7fvBVvxvWlVqxp65d86d5Xu39OlsPnfu3QerPOsTdW2poiNgnZy1EN1H' +
    'A3wlsE5mhwiRhQDNgR1OiRCZ/1P1K2CHcIEIkdkZ5MmCPV7OEyEyOYNaYJeeQYg4XzmQTzQEdtnaIce1+F4/3wb7LJMb' +
    'v3jPr4ADNKvIZcxcST+tgRM0kMskQ4h/ku8faKbckVuMQxhC2SByJpqxvGYEeT0oxgIMk+0TORPLmOcVOCQEEeTxpYke' +
    'y4FjQk0feY6lp2I14JwQXAvPxq+Rg/QMHBSS88jhvmgJnQSdFIIX80TjU5vHUhF01HozQ6gGezNDbIEOZUWwiL5FNgdA' +
    'owrNAkmWU9ffaISQzXbTaSGIIRuhml57A44LecvcqqZXj8ug80LwuyRwzJ9EFuVdoAiGavGBtvJmFKB4ssFuM/oTjPQe' +
    'DNhd7NQr/nL16WNVyLOUiPr3Nk9fXMjAZ3ENGTykl7M9mVsH3ZXkkoRcpMepSqfIkwpGkMEUuXssXXBC3i30UYToeg2Y' +
    'zKZRj4vc71vApFHVBCOhKiT+HA6bpxsGFh3U8wUllCgZH2d8yXdvnx965eEu+2U123jb86f/j2EXWNQSlBBrJoaBRf2/' +
    'nfZkP64Ytr33eS8qIeLfzK4Lb6MeSmhpFVhsoi+yKAvNoZtcAjeYQrsJC0L4q8IUOomLD8bmrZslpNTRipB0yjLKtc1M' +
    '6uweQ0huSZaEUFpnGG2u9bQhOut2Tg8O1jvd/YymvVs7jJTJOQmtCaG0rOiFEOeTsXgQKHbfuyVk1JCc40wxkY1aisns' +
    'A3G/etxq/6UAk6D3fHmvyjnzypeqDzGHWPRbWqNVt+q7FvVfRVrr13Pt84XF83bjrBOrV/zRgQ03tatt+EgfRYR+Rq4R' +
    'aAjsV1GQdCwEGm6Rh0v0RnMzrNsfDutJHxJ4Uu/aul+GIshlSvgG6PYJ6FCKjcurVNrDiH/fky4fR67jjAIL9JDPQ3JB' +
    'U41CnOIt3SycLecGsrBSj/328maVU+yBGTRgklxhVXohJ1bYwIqJm6oRNOQkYF+oWUFDNI9V0ZhKwK5Q6QiN0R4UKaOM' +
    'PaHSMfXUwezLnCvZjlDTbfZdwSRSHMnCQnS+6Ev8ESTxh60KrW4jie4B9iMkKYRIIcs+45aed+UzVoRqBaSZsnb76/ea' +
    'F5otWHsHMoZCRn+YFZpNMl7H3xv9l3uugVkzwv5wTlOImxO60Pi4RifGBqIwMepSdw9W49Mk9VGY+4Bunr/O4wCfjTLu' +
    'NEZGx9WMETkjskZTHPQZ574X+mlczZguZzT51yDIq5RBdGgmUJBUEYR4Ux6onQ8x+PjOg8/vfjI9PX33qwd3PjU0eiRs' +
    'tAUCLEZVn3+Kt9fWRsooDuBPLjNNu9a0SclGsO5KbWM9/xdWqUUU3JUsLCsJiK/EldyEFWGRtE3SJu0iCtp7bZu2KoL7' +
    'otfLq5W9tF33XsH77dV+G2mYIZO55Gx2ov19gj9nDvNMTs7jVdMEW1EhUC2TVwnAe+dNYp0r52l4Uo0jwajLMpJfLRHv' +
    'LPvULn1fzqOcU0ocoyBbIt6nzFM73as/N+UALLllrkS8M1UTnb6g/yvMIaEKqYUrEa/3HFn69qy+n4NgBLkS8XpfJQvv' +
    'ndHPMoNgBZkS2Uj0jWZloKF0araAB4cw01ZLogvfkYkrH+nXOmQJPEgy97rmvfQFGVzsNXwIulHyK6oL1GGR+t2vSOez' +
    'PsN3l9pAY1up2cUfYc3F9zWf6GXSek3Joy2QDMXoi0RE8eTC7dV+mJGc7JIMr+9z0rjcZ1wM6oIqRRSeXU7tEO3tz8fu' +
    'FiMmJbK/nNt3RZNHN870aAsEFGibojlgeDz9c5SIlpL5zVW+RP62GhNdVsYvX5/vMRmKOVC2k1ocCg+gJFG4Ob+/SzTG' +
    'l8jDtJHFsPaVt3rMVrkCKFveHS2GDzahSuQpSRsoa63PQmzPqQ+JXj/VY7Y4JUPjDi1jOEkxtcujNIcY5TW95LR3pqke' +
    'fvLx+ffNV14c0NqemkBkgdYTADD999IkgBhdn4DKYfOaEj9h8UHrd1oEkM6O5IC7Ww+KAJBYp6sJKHzCgu2LSmpPt0Kr' +
    'f+gHABj8Y6c4R9HR++N/zUf3iLKrUDQKC/6n63SVxI0KY/EVABgIE2VTGSKa2l+IUhoqt7CbiFspRaXhvRgO5YboYH/h' +
    '3sx0BDOUhwqSYBLVOxCuZiI4tLQRQcn01q1+lAlr/tB/EegmjQPAfZpTShYOj0KDueFhP5CESitTP5XammZwKDESHwQf' +
    'SOWte1MDszQAYJEKOLRGk9By27xWyk/FGqFzh9IA0pQDgBs0hgodguFps3khwQe97REAa7sRAOO711HJJzh+G42kHB06' +
    'v1EBSD0AMD0UvsZ86ZtPb+xcInGiRP+2vvUn0B/N5KAjC57wnLTzImqF3kZ8BUvzwHp8kPvOt18k48qtC3qDFBume1im' +
    'G5a/zXjetsdtIqcEvWSmQDO3aQ1gnljdn5vXvESblKfJTHICel1Ci4/UUPP1MWFaoompLB2Er3EF4nlq7qVu8xLNEn1Z' +
    'hIFL1K4z9BjXIgPQGciWTwz22ODL1PzIn4ztfmE+bPhljhk21JopxD67hmPdfqFyGEoEoxZhy/Huk5YXzp851q5bj3aB' +
    '5RJ1cLyz/USoualJaZim5tCJ9k4lC5PIZh77WqoPPR3ifye7YSkgi6PggjnJJY6I3GUaxymOjuwIoEKHEudIM/k63AAk' +
    'd6PPYUzzL95yTbCyGzDDAAAAAElFTkSuQmCC';
