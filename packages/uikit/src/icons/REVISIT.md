# Icons to revisit

Icons in `svg/` that were reconstructed from Figma MCP asset fragments rather than exported through
Figma's _Export → SVG_ panel. They should render identically, but sub-pixel rounding, masks, or
compound paths may differ. Verify each against a fresh Figma SVG export before considering it
"done"; overwrite the file and re-run `yarn workspace @tonkeeper/uikit icons`.

Remove an entry from this list once the SVG has been replaced (or visually diffed and confirmed)
against an authoritative Figma export.

## Pending

| File                   | Figma node                                                                                                                  | Notes                                                                                                                                                                                                                                                                                                              |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ic-arrow-left-16.svg` | [`25186:87568`](https://www.figma.com/design/JpzZCwMgxSCHkHeQGiaQXu/Current-Version?node-id=25186-87568) in Current-Version | **Riskier reconstruction.** Figma builds this by re-using the up-arrow geometry and applying `rotate(-90) scaleX(-1)` in CSS. Baked into the SVG as `transform="matrix(0 -1 1 0 2 12.75)"`. If the rendered icon points the wrong direction or sits in the wrong half of the box, this is the first thing to check |
