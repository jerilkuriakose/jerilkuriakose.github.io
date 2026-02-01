# Portfolio Website Documentation

## Overview

This is a personal portfolio website for Jeril Kuriakose, built with Next.js 14 and inspired by [brittanychiang.com](https://brittanychiang.com).

**Live URL:** https://jerilkuriakose.github.io

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| [Next.js 14](https://nextjs.org/) | React framework with App Router |
| [Tailwind CSS](https://tailwindcss.com/) | Utility-first CSS |
| [Framer Motion](https://www.framer.com/motion/) | Animations |
| [shadcn/ui](https://ui.shadcn.com/) | UI components |
| [Lucide Icons](https://lucide.dev/) | Icon library |
| [next-themes](https://github.com/pacocoursey/next-themes) | Dark/light mode |

---

## Project Structure

```
jerilkuriakose.github.io/
├── app/
│   ├── globals.css          # Global styles, CSS variables, custom classes
│   ├── layout.tsx           # Root layout, fonts, metadata, ThemeProvider
│   ├── page.tsx             # Main page with all sections
│   └── fonts/               # Local fonts (if any)
├── components/
│   ├── icons/               # Custom SVG icons (GitHub, LinkedIn, etc.)
│   ├── magicui/
│   │   ├── blur-fade.tsx    # Scroll animation component
│   │   ├── blur-fade-text.tsx # Text animation component
│   │   └── dock.tsx         # macOS-style dock for mobile
│   ├── ui/                  # shadcn/ui components
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── separator.tsx
│   │   └── tooltip.tsx
│   ├── theme-provider.tsx   # next-themes provider
│   └── theme-toggle.tsx     # Dark/light mode toggle button
├── data/
│   └── resume.tsx           # All CV/resume content (EDIT THIS FOR CONTENT)
├── lib/
│   └── utils.ts             # Utility functions (cn for classnames)
├── public/
│   ├── profile.jpg          # Your profile photo
│   └── Jeril_Kuriakose_CV.pdf # Downloadable resume
├── .github/
│   └── workflows/
│       └── deploy.yml       # GitHub Actions deployment
├── next.config.mjs          # Next.js config (static export)
├── tailwind.config.ts       # Tailwind configuration
└── package.json             # Dependencies
```

---

## How to Make Changes

### 1. Update Your Content (Most Common)

**File:** `data/resume.tsx`

This single file contains ALL your content:

```tsx
export const DATA = {
  name: "Jeril Kuriakose",
  title: "Principal Data Scientist (Gen AI)",
  location: "Riyadh, Saudi Arabia",
  description: "...",
  summary: "...",           // Supports **bold** markdown
  avatarUrl: "/profile.jpg",
  resumeUrl: "/Jeril_Kuriakose_CV.pdf",
  
  contact: {
    email: "jerilkuriakose10@gmail.com",
    social: [...]           // Social links with icons
  },
  
  skills: [...],            // Array of skill strings
  work: [...],              // Work experience
  education: [...],         // Education history
  projects: [...],          // Project showcase
  publications: [...],      // Research publications
  awards: [...]             // Awards and recognition
}
```

### 2. Update Profile Photo

1. Replace `public/profile.jpg` with your new photo
2. Keep the same filename, or update `avatarUrl` in `data/resume.tsx`

### 3. Update Downloadable Resume

1. Replace `public/Jeril_Kuriakose_CV.pdf` with your updated PDF
2. Or change the filename and update `resumeUrl` in `data/resume.tsx`

### 4. Change Colors/Theme

**File:** `app/globals.css`

The color scheme uses CSS variables:

```css
:root {
  /* Light mode colors */
  --primary: 166 76% 47%;        /* Teal accent */
  --background: 0 0% 100%;       /* White background */
  --foreground: 222 47% 11%;     /* Dark text */
  /* ... more variables */
}

.dark {
  /* Dark mode colors */
  --primary: 166 100% 70%;       /* Brighter teal */
  --background: 222 47% 11%;     /* Navy background */
  --foreground: 213 14% 80%;     /* Light text */
  /* ... more variables */
}
```

**To change the accent color:**
- Find a color you like in HSL format
- Replace the `--primary` values in both `:root` and `.dark`

### 5. Modify Layout/Sections

**File:** `app/page.tsx`

The page is organized into sections:
- Hero (full-screen intro)
- Fixed sidebars (social links, email, theme toggle)
- About Me
- Skills & Technologies
- Experience (Where I've Worked)
- Projects (Things I've Built)
- Publications (Research)
- Education
- Awards
- Contact (Get In Touch)
- Mobile Dock
- Footer

### 6. Add/Remove Social Links

**File:** `data/resume.tsx` → `contact.social` array

```tsx
social: [
  {
    name: "GitHub",
    url: "https://github.com/jerilkuriakose",
    icon: Icons.gitHub,
  },
  // Add more here...
]
```

**To add a new icon:**
1. Add the SVG to `components/icons/index.tsx`
2. Export it from the `Icons` object
3. Reference it in the social array

---

## Local Development

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Commands

```bash
# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run start

# Lint code
npm run lint
```

---

## Deployment

The site is automatically deployed to GitHub Pages via GitHub Actions.

### How it works:

1. Push changes to `main` branch
2. GitHub Actions runs `.github/workflows/deploy.yml`
3. Site is built with `next build`
4. Static files are deployed to GitHub Pages

### Manual deployment:

If GitHub Actions fails, you can deploy manually:

```bash
npm run build
# Then push the 'out' folder to gh-pages branch
```

### GitHub Pages Settings:

- Go to repo Settings → Pages
- Source: **GitHub Actions** (not "Deploy from a branch")

---

## Key Design Patterns

### 1. BlurFade Animation

Components fade in with a blur effect as they enter viewport:

```tsx
<BlurFade delay={0.04}>
  <YourComponent />
</BlurFade>
```

### 2. Numbered Headings

Section headings have automatic numbering:

```tsx
<h2 className="numbered-heading font-bold text-foreground">
  Section Title
</h2>
```

### 3. Card Hover Effect

Cards lift on hover:

```tsx
<div className="card-hover bg-card rounded-lg border border-border p-6 hover:border-primary/50">
  Content
</div>
```

### 4. Tech Badges

Styled skill/technology tags:

```tsx
<span className="tech-badge">Python</span>
```

---

## Customization Ideas

1. **Add a blog section** - Create `app/blog/page.tsx`
2. **Add project detail pages** - Create `app/projects/[slug]/page.tsx`
3. **Add animations** - Use more Framer Motion effects
4. **Change fonts** - Update `app/layout.tsx` with different Google Fonts
5. **Add a contact form** - Integrate with Formspree or similar

---

## Troubleshooting

### Build fails with ESLint errors

Fix apostrophe issues by using `&apos;` instead of `'`:
```tsx
// Bad
I'm a developer
// Good
I&apos;m a developer
```

### Images not loading

- Ensure images are in the `public/` folder
- Use paths starting with `/` (e.g., `/profile.jpg`)

### Dark mode not working

- Check that `ThemeProvider` wraps the app in `layout.tsx`
- Ensure `suppressHydrationWarning` is on the `<html>` tag

### Deployment not updating

1. Check GitHub Actions tab for errors
2. Verify Pages settings use "GitHub Actions" as source
3. Clear browser cache or use incognito mode

---

## Reference Portfolios

These portfolios inspired the design:

1. [brittanychiang.com](https://brittanychiang.com) - Dark theme, teal accent, numbered sections
2. [dillion.io](https://dillion.io) - BlurFade animations, macOS dock
3. [craftzdog.dev](https://www.craftz.dog/) - Clean, warm aesthetic
4. [leerob.io](https://leerob.io) - Minimalist, content-focused

---

## File Quick Reference

| To change... | Edit this file |
|--------------|----------------|
| Content (name, bio, work, etc.) | `data/resume.tsx` |
| Colors/theme | `app/globals.css` |
| Layout/sections | `app/page.tsx` |
| Metadata (SEO, title) | `app/layout.tsx` |
| Profile photo | `public/profile.jpg` |
| Resume PDF | `public/Jeril_Kuriakose_CV.pdf` |
| Social icons | `components/icons/index.tsx` |
| Deployment config | `.github/workflows/deploy.yml` |

---

## Support

For issues or questions:
- Next.js docs: https://nextjs.org/docs
- Tailwind CSS docs: https://tailwindcss.com/docs
- shadcn/ui docs: https://ui.shadcn.com/docs
