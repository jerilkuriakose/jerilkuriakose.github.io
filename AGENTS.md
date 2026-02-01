# CV Sync Agent Instructions

## Overview

This workspace contains two repositories that must be kept in sync:

1. **LaTeX CV (Source of Truth):** `/home/sagemaker-user/repos/cvs/jk-cv/`
2. **Portfolio Website:** `/home/sagemaker-user/repos/cvs/jerilkuriakose.github.io/`

**Sync Direction:** LaTeX → Portfolio (LaTeX is the source of truth)

---

## Repository Locations

```
/home/sagemaker-user/repos/cvs/
├── jk-cv/                          # LaTeX CV (SOURCE)
│   ├── cv.tex                      # Main CV file
│   ├── cv/
│   │   ├── experience.tex          # Work experience
│   │   ├── skills.tex              # Technical skills
│   │   ├── education.tex           # Education history
│   │   ├── publications.tex        # Publications
│   │   ├── awards.tex              # Awards
│   │   └── summary.tex             # Professional summary
│   ├── CV-Jeril Kuriakose.pdf      # Generated PDF
│   └── image.jpg                   # Profile photo
│
└── jerilkuriakose.github.io/       # Portfolio Website (TARGET)
    ├── data/resume.tsx             # Content data file (UPDATE THIS)
    ├── public/
    │   ├── Jeril_Kuriakose_CV.pdf  # Copy PDF here
    │   └── profile.jpg             # Profile photo
    └── ...
```

---

## Workflow: When User Asks to Update CV

### Step 1: Make Changes in LaTeX

Edit the appropriate `.tex` file in `jk-cv/cv/`:

| Content Type | LaTeX File |
|--------------|------------|
| Work experience | `cv/experience.tex` |
| Skills | `cv/skills.tex` |
| Education | `cv/education.tex` |
| Publications | `cv/publications.tex` |
| Awards | `cv/awards.tex` |
| Summary/Bio | `cv/summary.tex` |
| Personal info | `cv.tex` (header section) |

### Step 2: Sync to Portfolio

After LaTeX changes, update `jerilkuriakose.github.io/data/resume.tsx`:

**Mapping LaTeX → Portfolio:**

| LaTeX | Portfolio (resume.tsx) |
|-------|------------------------|
| `\cventry{title}{company}{location}{dates}{description}` | `work: [{ title, company, location, start, end, description, highlights }]` |
| `\cvskill{category}{skills}` | `skills: [...]` |
| `\cveducation{degree}{school}{location}{dates}` | `education: [{ degree, school, location, start, end }]` |
| `\cvpublication{title}{authors}{journal}{year}` | `publications: [{ title, authors, journal, year }]` |
| `\cvaward{title}{org}{date}` | `awards: [{ title, organization, date }]` |

### Step 3: Rebuild PDF (if LaTeX changed)

**IMPORTANT:** pdflatex is NOT installed in this environment. 

**Option A - If pdflatex is available:**
```bash
cd /home/sagemaker-user/repos/cvs/jk-cv
pdflatex cv.tex
# Or use the Makefile:
make
```

**Option B - If pdflatex is NOT available (current situation):**
1. Inform the user: "LaTeX compilation requires pdflatex which is not installed. Please compile the PDF locally or via Overleaf."
2. Skip to Step 4 if an existing PDF is already present
3. The user can:
   - Install TeX Live: `sudo apt-get install texlive-full` (large, ~5GB)
   - Install basic TeX: `sudo apt-get install texlive-latex-base texlive-fonts-recommended texlive-latex-extra`
   - Use Overleaf online
   - Compile locally on their machine

### Step 4: Copy PDF to Portfolio

Only do this if a PDF exists (either newly compiled or previously existing):

```bash
# Check if PDF exists
if [ -f "/home/sagemaker-user/repos/cvs/jk-cv/CV-Jeril Kuriakose.pdf" ]; then
  cp "/home/sagemaker-user/repos/cvs/jk-cv/CV-Jeril Kuriakose.pdf" \
     "/home/sagemaker-user/repos/cvs/jerilkuriakose.github.io/public/Jeril_Kuriakose_CV.pdf"
  echo "PDF copied successfully"
else
  echo "WARNING: PDF not found. Please compile LaTeX first."
fi
```

### Step 5: Build Portfolio (Verify)

```bash
cd /home/sagemaker-user/repos/cvs/jerilkuriakose.github.io
npm run build
```

---

## Workflow: When User Says "Commit" or "Push"

Always commit and push BOTH repositories:

### Commit Both Repos

```bash
# Commit LaTeX CV
cd /home/sagemaker-user/repos/cvs/jk-cv
git add -A
git commit -m "Update CV: <description of changes>"

# Commit Portfolio
cd /home/sagemaker-user/repos/cvs/jerilkuriakose.github.io
git add -A
git commit -m "Sync from LaTeX: <description of changes>"
```

### Push Both Repos

```bash
# Push LaTeX CV
cd /home/sagemaker-user/repos/cvs/jk-cv
git push origin main

# Push Portfolio
cd /home/sagemaker-user/repos/cvs/jerilkuriakose.github.io
git push origin main
```

---

## Content Transformation Examples

### Experience Entry

**LaTeX (`cv/experience.tex`):**
```latex
\cventry
  {Principal Data Scientist (Gen AI)}
  {Saudi Data \& AI Authority (SDAIA)}
  {Riyadh, Saudi Arabia}
  {Jan 2024 - Present}
  {
    \begin{cvitems}
      \item Leading ALLaM development
      \item Processed 50TB data
    \end{cvitems}
  }
```

**Portfolio (`data/resume.tsx`):**
```tsx
{
  company: "Saudi Data & AI Authority (SDAIA)",
  title: "Principal Data Scientist (Gen AI)",
  location: "Riyadh, Saudi Arabia",
  start: "Jan 2024",
  end: "Present",
  description: "Leading ALLaM (Arabic Large Language Model) development...",
  highlights: [
    "Leading ALLaM development",
    "Processed 50TB data",
  ],
}
```

### Skills

**LaTeX (`cv/skills.tex`):**
```latex
\cvskill{ML/AI}{PyTorch, Transformers, LangChain, vLLM}
\cvskill{Infrastructure}{Kubernetes, Docker, Azure}
```

**Portfolio (`data/resume.tsx`):**
```tsx
skills: [
  "PyTorch",
  "Transformers", 
  "LangChain",
  "vLLM",
  "Kubernetes",
  "Docker",
  "Azure",
]
```

### Education

**LaTeX (`cv/education.tex`):**
```latex
\cveducation
  {Ph.D. in Computer Engineering}
  {Manipal University Jaipur}
  {Jaipur, India}
  {Jul 2013 - Dec 2019}
```

**Portfolio (`data/resume.tsx`):**
```tsx
{
  school: "Manipal University Jaipur, School of Computing and IT",
  degree: "Ph.D. in Computer Engineering",
  location: "Jaipur, India",
  start: "Jul 2013",
  end: "Dec 2019",
  gpa: "9.62",
  description: "Research focus: Secure localization...",
}
```

---

## Quick Reference Commands

```bash
# Check status of both repos
cd /home/sagemaker-user/repos/cvs/jk-cv && git status
cd /home/sagemaker-user/repos/cvs/jerilkuriakose.github.io && git status

# Sync PDF after LaTeX rebuild
cp "/home/sagemaker-user/repos/cvs/jk-cv/CV-Jeril Kuriakose.pdf" \
   "/home/sagemaker-user/repos/cvs/jerilkuriakose.github.io/public/Jeril_Kuriakose_CV.pdf"

# Build and verify portfolio
cd /home/sagemaker-user/repos/cvs/jerilkuriakose.github.io && npm run build

# Commit both (run separately)
cd /home/sagemaker-user/repos/cvs/jk-cv && git add -A && git commit -m "MSG"
cd /home/sagemaker-user/repos/cvs/jerilkuriakose.github.io && git add -A && git commit -m "MSG"

# Push both (run separately)
cd /home/sagemaker-user/repos/cvs/jk-cv && git push origin main
cd /home/sagemaker-user/repos/cvs/jerilkuriakose.github.io && git push origin main
```

---

## Important Notes

1. **LaTeX is the source of truth** - Always make content changes in LaTeX first
2. **Sync after every LaTeX change** - Update portfolio's `data/resume.tsx`
3. **Copy PDF after rebuilding** - Keep the downloadable CV up to date
4. **Commit both repos together** - Use similar commit messages for traceability
5. **Portfolio has extra fields** - Some fields (like `highlights` array) may have more detail in portfolio than LaTeX

---

## Files to Watch

When these LaTeX files change, sync to portfolio:

| LaTeX File Changed | Update in Portfolio |
|--------------------|---------------------|
| `cv/experience.tex` | `work` array in `data/resume.tsx` |
| `cv/skills.tex` | `skills` array in `data/resume.tsx` |
| `cv/education.tex` | `education` array in `data/resume.tsx` |
| `cv/publications.tex` | `publications` array in `data/resume.tsx` |
| `cv/awards.tex` | `awards` array in `data/resume.tsx` |
| `cv/summary.tex` | `summary` field in `data/resume.tsx` |
| `cv.tex` (header) | `name`, `title`, `location`, `contact` in `data/resume.tsx` |
| `image.jpg` | Copy to `public/profile.jpg` |
| `CV-Jeril Kuriakose.pdf` | Copy to `public/Jeril_Kuriakose_CV.pdf` |
