import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Newsreader } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { DATA } from "@/data/resume";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

/**
 * Serif display face for headings (spec §4), chosen empirically - see
 * docs/superpowers/artefacts/2026-09-01-phase3-typeface-bakeoff.png.
 *
 * The variable is "--font-newsreader", NEVER "--font-display": Tailwind 4
 * generates font tokens from @theme, and if next/font claims one of those names
 * the result is a self-referential loop and silently broken typography with no
 * error. @theme inline maps --font-display to this. See docs/tailwind4-notes.md.
 *
 * `axes: ["opsz"]` is why this face was selected over the alternatives - the
 * optical-size axis gives 72px display and 36px mobile different letterforms.
 */
const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
  axes: ["opsz"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4F9F7" },
    { media: "(prefers-color-scheme: dark)", color: "#17342D" },
  ],
};

/**
 * One description string for the page, Open Graph and Twitter.
 *
 * They previously disagreed - the top-level string was longer than the two card
 * strings - which the metadata guidance forbids and which makes "the description
 * agrees everywhere" untestable.
 */
const DESCRIPTION =
  "Principal Data Scientist with deep expertise in LLMs, NLP, and agentic AI systems. Leading end-to-end development of high-impact AI platforms including Arabic LLMs (ALLaM).";

export const metadata: Metadata = {
  metadataBase: new URL("https://jerilkuriakose.github.io"),
  title: "Jeril Kuriakose | Principal Data Scientist",
  description: DESCRIPTION,
  // Must equal metadataBase and og:url. The live site normalises og:url with a
  // trailing slash, so any test comparing them has to normalise first.
  alternates: { canonical: "https://jerilkuriakose.github.io" },
  keywords: [
    "Data Scientist",
    "Machine Learning",
    "LLM",
    "NLP",
    "Artificial Intelligence",
    "Gen AI",
    "Arabic LLM",
    "ALLaM",
    "MLOps",
    "Deep Learning",
  ],
  authors: [{ name: "Jeril Kuriakose" }],
  creator: "Jeril Kuriakose",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://jerilkuriakose.github.io",
    siteName: "Jeril Kuriakose Portfolio",
    title: "Jeril Kuriakose | Principal Data Scientist",
    description: DESCRIPTION,
    // 1200x630, branded, carrying the two approved impact claims. Replaces
    // /profile.jpg, which was declared 800x800 while actually being 996x1325 -
    // a tall portrait on a summary_large_image card, so it centre-cropped to a
    // slice. Dimensions here are asserted against the real PNG header.
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Jeril Kuriakose — Principal Data Scientist (Gen AI)",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jeril Kuriakose | Principal Data Scientist",
    description: DESCRIPTION,
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};


/**
 * One JSON-LD @graph, built from DATA so it reflects what the page renders
 * (never hand-typed, so it cannot drift).
 *
 * @graph rather than nesting: the articles are independent nodes, they reference
 * the Person by @id, and they stay countable.
 *
 * `url` appears on an article ONLY where DATA identifies that specific work.
 * Four of the five publications share the same generic Google Scholar PROFILE
 * url; emitting that as an article url would be misleading structured data, so
 * it is omitted until real DOIs exist.
 */
const SITE = "https://jerilkuriakose.github.io";
const isArticleUrl = (url: string) => url.includes("doi.org");

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${SITE}/#person`,
      name: DATA.name,
      jobTitle: DATA.title,
      description: DESCRIPTION,
      url: SITE,
      image: `${SITE}${DATA.avatarUrl}`,
      email: `mailto:${DATA.contact.email}`,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Riyadh",
        addressCountry: "SA",
      },
      sameAs: DATA.contact.social.map((s) => s.url),
      knowsAbout: [...DATA.skills],
    },
    ...DATA.publications.map((pub) => ({
      "@type": "ScholarlyArticle",
      headline: pub.title,
      name: pub.title,
      datePublished: pub.year,
      isPartOf: { "@type": "Periodical", name: pub.journal },
      author: { "@id": `${SITE}/#person` },
      ...(isArticleUrl(pub.url) ? { url: pub.url } : {}),
    })),
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Font variables go on <html>, NOT <body>. @theme declares tokens like
    // --font-display: var(--font-newsreader), ... on :root, and a custom
    // property's var() is substituted where the property is DECLARED. With the
    // provider variables on <body>, --font-newsreader is undefined at :root, so
    // --font-display computes broken and every `var(--font-display)` consumer
    // silently falls back. Inter appeared to work only because @theme inline
    // also emits an inlined .font-sans utility, which resolves in the element's
    // own context. Measured: var(--font-display) returned the Inter stack.
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${newsreader.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased">
        {/* First focusable element in the document. Visually hidden until focused,
            so keyboard users can bypass the fixed rails and reach the content. */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-md focus:bg-canvas focus:px-4 focus:py-2 focus:font-mono focus:text-sm focus:text-ink focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-focus"
        >
          Skip to main content
        </a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
