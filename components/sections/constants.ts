/**
 * Per-element stagger for BlurFade entrance animations.
 *
 * Shared rather than duplicated per file: the decomposition splits ~25 call
 * sites across a dozen components, and every multiplier must stay identical or
 * the zero-tolerance screenshot baseline moves.
 */
export const BLUR_FADE_DELAY = 0.04;
