---
status: draft
---

# Goal

Fix the desktop constellation interaction so closing a section while its node is still zooming in does not make the galaxy UI jump. Keep the existing node zoom and smooth return-to-map behavior.

## Repository context

`new-portfolio-ko/src/components/portfolio/ExploreGalaxy.tsx` starts a 680 ms `zoomToElement` animation when a desktop node is selected. Its `ResetViewOnModalClose` effect separately starts a 650 ms `resetTransform` when `activeSection` becomes `null`. Closing is handled by `PortfolioExperience.tsx`, while `SectionModal.tsx` supports Back, Escape, and backdrop dismissal. This means the open-zoom and close-reset lifecycle currently meet in `ExploreGalaxy.tsx`; the other files already funnel close actions through the same state change and should not need edits.

## Implementation steps

1. **Coordinate node zoom and close reset in `ExploreGalaxy.tsx`.** Make one transform-animation lifecycle own both the node zoom and the reset. On close during an in-flight zoom, interrupt or replace that animation using the supported controls in the installed `react-zoom-pan-pinch` 4.2.0 API before starting the reset, so an old animation cannot later apply stale transform updates. If the API requires completion coordination instead, guard it so a delayed completion cannot override a newer selection or reset. Keep the existing 680 ms node zoom, smooth reset, click behavior, wheel zoom, pan, and reset control intact. Do not add fixed-delay timers or a dependency.

2. **Verify the interaction and existing checks.** In a desktop browser, select a node and close immediately and midway through the zoom using Back, Escape, and backdrop dismissal. Confirm the map returns smoothly to its original view without a jump; also confirm closing after the zoom finishes and reopening a node still behave correctly. Check that the mobile trail, which does not use the desktop transform wrapper, remains unchanged. Run `npm run lint` and `npm run build` from `new-portfolio-ko`.

## Planned project structure

```text
new-portfolio-ko/
└── src/components/portfolio/
    └── ExploreGalaxy.tsx  (modify)
```

## File-by-file changes

- **Modify `new-portfolio-ko/src/components/portfolio/ExploreGalaxy.tsx`:** Coordinate the desktop node-zoom and modal-close reset animations, preventing overlapping or stale transform updates while preserving existing controls and timing.

No test file is planned: the existing tests cover server behavior, and the repository documents browser interaction checks separately from lint/build checks. Verify this timing-sensitive visual behavior directly in a browser rather than adding an unconfigured browser-test framework.

## Acceptance criteria and risks

- Closing during the 680 ms node zoom produces no visible jump or stale follow-on movement, and the map returns to its base view smoothly.
- Closing after zoom completion, reopening nodes, wheel zoom, manual pan, and the reset button continue to work.
- Mobile section selection and modal dismissal are unchanged.
- Keep the change limited to the zoom/reset lifecycle. Use the dependency's supported API rather than reaching into undocumented internals; if that API does not allow reliable interruption, stop and reassess before broadening scope.
