/**
 * Phase 5 photography manifest (spec §6, §15).
 *
 * Every photographic source on the site is declared HERE and nowhere else.
 * `tests/visual/photo-contract.spec.ts` asserts that each rendered photo
 * carries `data-photo` and resolves to an entry in this file, so an unmarked
 * `<img>` or a CSS `background-image` cannot slip past the two-region cap.
 *
 * Why the variants are committed rather than generated: `next.config.mjs` sets
 * `output: "export"` with `images.unoptimized: true`, so Next contributes no
 * image processing whatsoever - no resizing, no format negotiation, no srcset.
 * A missing width here silently ships a full-size file as the LCP image.
 */

/** One concrete file on disk. `w`/`h` are read from the file header, not intended. */
export type PhotoVariant = {
  src: string;
  w: number;
  h: number;
  type: "image/webp" | "image/jpeg";
  bytes: number;
};

/**
 * WCAG relative luminance statistics for one vertical third of the source.
 *
 * These exist because a whole-image mean is NOT contrast evidence: on the hero
 * source the left third means 0.0177 while the right third peaks at 0.535. The
 * crop is chosen from these numbers; legibility is still measured on the real
 * composite by photo-contract.
 */
export type ThirdStats = { mean: number; p95: number; max: number; std: number };

export type Photo = {
  id: string;
  alt: string;
  /** Intrinsic size of the source. No variant may exceed this - upscaling is barred. */
  intrinsic: readonly [number, number];
  /**
   * Mean WCAG relative luminance (linearised, 0.2126R + 0.7152G + 0.0722B) and
   * mean OKLab L. Both are named deliberately: an earlier draft carried a "mean
   * L" that was actually gamma-encoded weighted RGB - neither of these.
   */
  wcagLuminance: number;
  oklabL: number;
  thirds: readonly [ThirdStats, ThirdStats, ThirdStats];
  variants: readonly PhotoVariant[];
  /** CSS object-position, chosen from `thirds`. */
  objectPosition: string;
  provenance: {
    origin: string;
    generatedOn: string;
    /**
     * §6 requires a licensing check. Recording the generator alone is
     * provenance, not licensing - this is the usage-right basis, kept so the
     * check is auditable later without re-deriving it.
     */
    usageRights: string;
  };
};

const PROVENANCE = {
  origin: "AI-generated, OpenAI image generation via the Codex CLI (image_gen.imagegen)",
  generatedOn: "2026-09-01",
  usageRights:
    "Generated output used under the OpenAI Terms of Use, which assign output ownership to the generating account; no third-party stock licence applies and no identifiable person or trademark appears. Owner-approved for public attribution on 2026-09-01 (spec gate G4).",
} as const;

/**
 * Hero. Dark ink-in-water plume, WCAG luminance 0.0337 - very dark, which is why the
 * light-theme scrim LIGHTENS it. The plume occupies thirds 2-3, so the crop is
 * pushed right rather than centred; a centred crop reads as an empty rectangle.
 */
export const HERO_PHOTO: Photo = {
  id: "hero-ink",
  alt: "",
  intrinsic: [1774, 887],
  wcagLuminance: 0.0337,
  oklabL: 0.2824,
  thirds: [
      { mean: 0.0177, p95: 0.0486, max: 0.0759, std: 0.014 },
      { mean: 0.0456, p95: 0.1332, max: 0.3457, std: 0.0392 },
      { mean: 0.0376, p95: 0.1476, max: 0.5352, std: 0.0528 },
  ],
  variants: [
      { src: "/media/hero-ink-640.webp", w: 640, h: 320, type: "image/webp", bytes: 8136 },
      { src: "/media/hero-ink-640.jpg", w: 640, h: 320, type: "image/jpeg", bytes: 16538 },
      { src: "/media/hero-ink-1280.webp", w: 1280, h: 640, type: "image/webp", bytes: 21264 },
      { src: "/media/hero-ink-1280.jpg", w: 1280, h: 640, type: "image/jpeg", bytes: 48363 },
      { src: "/media/hero-ink-1774.webp", w: 1774, h: 887, type: "image/webp", bytes: 33204 },
      { src: "/media/hero-ink-1774.jpg", w: 1774, h: 887, type: "image/jpeg", bytes: 79856 },
  ],
  objectPosition: "68% 50%",
  provenance: PROVENANCE,
};

/**
 * Contact. Pale refracted glass, WCAG luminance 0.4102 - LIGHT, the opposite of the
 * hero, so in dark theme the scrim must DARKEN it for light ink to read. That
 * polarity flip is why `--scrim` is defined per theme rather than once.
 */
export const CONTACT_PHOTO: Photo = {
  id: "contact-glass",
  alt: "",
  intrinsic: [1536, 1024],
  wcagLuminance: 0.4102,
  oklabL: 0.7264,
  thirds: [
      { mean: 0.4173, p95: 0.7044, max: 0.9694, std: 0.1503 },
      { mean: 0.4608, p95: 0.6444, max: 0.9469, std: 0.1223 },
      { mean: 0.3525, p95: 0.6114, max: 0.9981, std: 0.1628 },
  ],
  variants: [
      { src: "/media/contact-glass-640.webp", w: 640, h: 427, type: "image/webp", bytes: 39732 },
      { src: "/media/contact-glass-640.jpg", w: 640, h: 427, type: "image/jpeg", bytes: 49529 },
      { src: "/media/contact-glass-1280.webp", w: 1280, h: 853, type: "image/webp", bytes: 140760 },
      { src: "/media/contact-glass-1280.jpg", w: 1280, h: 853, type: "image/jpeg", bytes: 191430 },
      { src: "/media/contact-glass-1536.webp", w: 1536, h: 1024, type: "image/webp", bytes: 186768 },
      { src: "/media/contact-glass-1536.jpg", w: 1536, h: 1024, type: "image/jpeg", bytes: 264708 },
  ],
  objectPosition: "50% 50%",
  provenance: PROVENANCE,
};

export const PHOTOS: readonly Photo[] = [HERO_PHOTO, CONTACT_PHOTO];

/**
 * Six further candidates were generated and verified but NOT committed, to keep
 * ~13MB of unused binaries out of the repository. Recorded so the selection is
 * reproducible rather than folklore.
 */
export const REJECTED_CANDIDATES = [
  { id: "01-glass", reason: "Composition too busy behind the portrait stack" },
  { id: "03-water", reason: "Highlights cross the badge position" },
  { id: "04-metal", reason: "Directional streaks fight the ring geometry" },
  { id: "05-paper", reason: "Reads cool-grey rather than on-hue; fallback only" },
  { id: "06-fabric", reason: "Reads cool-grey rather than on-hue; fallback only" },
  { id: "08-ink-alt", reason: "Near-duplicate of hero-ink with a weaker plume" },
] as const;

/** Largest-first `srcSet`, filtered to one MIME type for a `<source>` element. */
export function srcSetFor(photo: Photo, type: PhotoVariant["type"]): string {
  return photo.variants
    .filter((v) => v.type === type)
    .sort((a, b) => b.w - a.w)
    .map((v) => `${v.src} ${v.w}w`)
    .join(", ");
}

/** Widest JPEG - the universal `<img>` fallback. */
export function fallbackFor(photo: Photo): PhotoVariant {
  const jpegs = photo.variants.filter((v) => v.type === "image/jpeg");
  const widest = jpegs.reduce((a, b) => (b.w > a.w ? b : a), jpegs[0]);
  if (!widest) throw new Error(`Photo ${photo.id} has no JPEG fallback variant`);
  return widest;
}
