import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Newsreader } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

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

export const metadata: Metadata = {
  metadataBase: new URL("https://jerilkuriakose.github.io"),
  title: "Jeril Kuriakose | Principal Data Scientist",
  description:
    "Principal Data Scientist with deep expertise in LLMs, NLP, and agentic AI systems. Leading end-to-end development of high-impact AI platforms including Arabic LLMs (ALLaM).",
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
    description:
      "Principal Data Scientist with deep expertise in LLMs, NLP, and agentic AI systems.",
    images: [
      {
        url: "/profile.jpg",
        width: 800,
        height: 800,
        alt: "Jeril Kuriakose",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jeril Kuriakose | Principal Data Scientist",
    description:
      "Principal Data Scientist with deep expertise in LLMs, NLP, and agentic AI systems.",
    images: ["/profile.jpg"],
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
