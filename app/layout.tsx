import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
