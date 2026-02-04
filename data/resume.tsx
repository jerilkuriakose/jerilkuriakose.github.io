import { Icons } from "@/components/icons";

export const DATA = {
  name: "Jeril Kuriakose",
  initials: "JK",
  title: "Principal Data Scientist (Gen AI)",
  location: "Riyadh, Saudi Arabia",
  locationLink: "https://maps.google.com/?q=Riyadh,Saudi+Arabia",
  description:
    "Principal Data Scientist with deep expertise in LLMs, NLP, and agentic AI systems. Leading end-to-end development of high-impact AI platforms.",
  summary:
    "Principal Data Scientist with deep expertise in **LLMs**, NLP, and **agentic AI systems**. Leads end-to-end development of high-impact platforms from data engineering and training to **MLOps**, **inference optimization**, and **secure deployment at scale**. Proven record of measurable business outcomes (productivity savings, accuracy gains, and risk reduction) and hands-on leadership of cross-functional data teams.\n\nRecent focus: **Arabic LLMs (ALLaM)**, **agent orchestration**, curriculum **SFT**, **DPO**, **RL–SFT** hybrid training, and large-scale inference on **Kubernetes** with **vLLM/TGI/Triton**, Ray, and Azure.",
  avatarUrl: "/profile.jpg",
  resumeUrl: "/Jeril_Kuriakose_CV.pdf",
  extraInfo: "Saudi Arabia Premium Resident",
  yearsOfExperience: "14+",

  contact: {
    email: "jerilkuriakose10@gmail.com",
    tel: "+966509514280",
    social: [
      {
        name: "GitHub",
        url: "https://github.com/jerilkuriakose",
        icon: Icons.gitHub,
      },
      {
        name: "LinkedIn",
        url: "https://www.linkedin.com/in/jerilkuriakose/",
        icon: Icons.linkedin,
      },
      {
        name: "Stack Overflow",
        url: "https://stackoverflow.com/users/2825570/jeril",
        icon: Icons.stackoverflow,
      },
      {
        name: "Google Scholar",
        url: "https://scholar.google.com/citations?user=qRQlmIoAAAAJ&hl=en&oi=ao",
        icon: Icons.scholar,
      },
    ],
  },

  skills: [
    "LLMs",
    "NLP",
    "Agentic Systems",
    "RAG",
    "Generative AI",
    "Time-series",
    "Graph ML",
    "PyTorch",
    "Transformers",
    "TRL",
    "vLLM",
    "TGI",
    "Triton",
    "Ray",
    "LangChain",
    "LangGraph",
    "MLflow",
    "DeepSpeed",
    "Megatron-LM",
    "NVIDIA NeMo",
    "Docker",
    "Kubernetes",
    "Azure",
    "DVC",
    "FastAPI",
    "CI/CD",
    "Dify",
    "LangFuse",
    "PostgreSQL",
    "MongoDB",
    "ClickHouse",
    "DuckDB",
    "Qdrant",
    "Elasticsearch",
    "Python",
    "Polars",
    "Plotly",
    "Claude Code",
    "OpenCode",
    "Codex",
  ],

  work: [
    {
      company: "Saudi Data & AI Authority (SDAIA)",
      url: "https://sdaia.gov.sa/en/default.aspx",
      title: "Principal Data Scientist (Gen AI)",
      location: "Riyadh, Saudi Arabia",
      start: "Jan 2024",
      end: "Present",
      description:
        "Leading ALLaM (Arabic Large Language Model) development - data processing, training pipelines, and inference optimization at scale.",
      highlights: [
        "Lead data processing and inference optimization for ALLaM; managed training/inference stacks with PyTorch, Transformers, TRL, vLLM/TGI/Triton, Ray, Kubernetes, Azure",
        "Processed 50TB RedPajama-Data-v2 via Data-Juicer; implemented LLaMA-2 pretraining strategies (from-scratch and continual)",
        "Developed generative data-cleaning models to improve pretraining corpus quality and downstream performance",
        "Fine-tuned ALLaM for function/tool calling and multi-agent orchestration in secure government environments",
        "Architected self-healing agentic data pipelines with autonomous error recovery and optimization",
        "Built custom MCP servers to integrate in-house data platforms and standardize tool connectivity",
        "Implemented agentic RAG and multi-agent planning/orchestration using LangChain, LangGraph, and Dify",
        "Deployed/optimized ALLaM 7B/13B/70B on Kubernetes; identified optimal inference parameters across use cases",
        "Designed curriculum SFT pipeline for agentic capabilities; improved model convergence by ~35%",
        "Developed interleaved RL with periodic SFT injections to stabilize agent policy optimization",
        "Created iterative DPO framework with uncertainty-aware preference collection and dynamic reward modeling",
        "Introduced self-optimized fine-tuning (SOFT) via self-distillation and adaptive curriculum scheduling",
        "Evaluated Grok, DBRX, Command R+ using LM-Harness for English and Arabic; informed model selection",
        "Built user analytics platform for LLM chat telemetry using ClickHouse, DuckDB, Polars, and Plotly",
        "Designed AI-augmented development workflows using Claude Code, OpenCode, and Codex; authored custom skills and agents to automate engineering tasks and accelerate delivery",
      ],
    },
    {
      company: "Mizuho Bank",
      url: "https://www.mizuhogroup.com/asia-pacific/singapore",
      title: "Senior Data Scientist",
      location: "Singapore",
      start: "Jul 2019",
      end: "Dec 2023",
      description:
        "Led multiple award-winning AI/ML projects for banking operations, achieving significant productivity gains and cost savings.",
      highlights: [
        "Phoenix: Generic NLP IE platform using BERT + hybrid CNN + Bloom embeddings; ~90% accuracy; saved ~100,000 man-hours/year",
        "PIGEON: Document classification with RoBERTa and summarization (GPT-2/GPT Neo); achieved 97% accuracy",
        "SWAN: AML name check reduced false positives by 20%; vector DB for embeddings; graph neural networks for anomaly detection",
        "HAWK: Hybrid encoder–decoder LSTM for daily/weekly/monthly forecasts; saved ~3,000 man-hours/year",
        "Oxygen: Hybrid Seq2Seq + BERT extraction for loan agreements; saved ~6,500 man-hours/year",
        "LLM PoCs: Falcon-7B, LLaMA-2-7B fine-tuned via QLoRA/PEFT/bitsandbytes on dual T4 GPUs",
        "Introduced MLflow for org-wide model tracking; implemented ML monitoring and performance validation",
        "Adopted Ray/Ray AIR for distributed training and multi-GPU serving; standardized FastAPI microservices",
        "Built internal PyPI and Docker Registry to accelerate packaging and image distribution",
        "Established active learning loops to auto-annotate large datasets and continuously improve model quality",
        "Mentored junior data scientists; led architecture for AI projects; tracked research trends",
      ],
    },
    {
      company: "Baker Hughes (GE Company)",
      url: "https://www.bakerhughes.com/",
      title: "Senior Data Scientist",
      location: "Kochi, India",
      start: "Jan 2019",
      end: "Jun 2019",
      description:
        "Applied ML for oil & gas operations optimization and predictive maintenance.",
      highlights: [
        "Predicted stuck-pipe events with feature-engineered ensemble models; identified key drivers and timing",
        "Analyzed non-productive time (NPT) and drill-bit wear; delivered actionable insights to reduce rig downtime",
        "Drove awareness of applied data science among SMEs through targeted training",
      ],
    },
    {
      company: "Innovation Incubator",
      url: "https://innovationincubator.com/",
      title: "Senior AI Engineer",
      location: "Thiruvananthapuram, India",
      start: "Feb 2018",
      end: "Jan 2019",
      description:
        "Built end-to-end ML solutions for healthcare RCM and document processing.",
      highlights: [
        "OCR text extraction from images using Pytesseract; axis detection and Excel export",
        "Generic keyword extraction across PDFs/TXT/Excel/HTML via ensemble ML and feature engineering",
        "Customer segmentation and claim-settlement prediction; improved healthcare RCM by ~18%",
        "Owned end-to-end ML pipelines and backend services; collaborated with customers to translate business to ML problems",
      ],
    },
    {
      company: "Raw Data Technologies",
      url: "https://www.rawdatatech.com/",
      title: "Senior ML/AI Developer",
      location: "Kochi, India",
      start: "Apr 2017",
      end: "Feb 2018",
      description:
        "Developed predictive models for fintech and logistics applications.",
      highlights: [
        "EMI defaulter prediction with ensemble models; extensive feature engineering; deployed APIs and data pipelines",
        "Performance analysis using Kaplan–Meier estimator and cumulative incidence",
        "Logistics: demand forecasting; promotional price optimization; markdown optimization",
        "Research: evolutionary algorithms + Hyperopt to optimize automotive design structures",
      ],
    },
    {
      company: "St. John College of Engineering and Technology",
      url: "https://sjcem.edu.in/",
      title: "Assistant Professor & Data Analyst",
      location: "Palghar, India",
      start: "Jun 2015",
      end: "Mar 2017",
      description: "Taught ML/Data Mining courses and built analytics solutions.",
      highlights: [
        "Taught ML/Data Mining; developed analytics and ERP modules; produced institutional reports and student performance analytics",
      ],
    },
    {
      company: "Manipal University Jaipur",
      url: "https://jaipur.manipal.edu/",
      title: "PhD Scholar, Developer, Data Analyst",
      location: "Jaipur, India",
      start: "Jul 2013",
      end: "Jun 2015",
      description: "Research and development work during doctoral studies.",
      highlights: [
        "Maintained university ERP; conducted predictive analytics on student outcomes; built data pipelines and departmental reporting",
      ],
    },
    {
      company: "Kavery College of Engineering",
      url: "https://www.kavery.org.in/engg/index.aspx",
      title: "Developer & Assistant Professor",
      location: "Salem, Tamil Nadu",
      start: "Jun 2012",
      end: "Jun 2013",
      description: "Developed educational ERP for college using Django framework.",
      highlights: [
        "Developed educational ERP for college; server-side coding with Python/Django; functional testing, bug fixing, and end-user support",
      ],
    },
  ],

  education: [
    {
      school: "Manipal University Jaipur, School of Computing and IT",
      url: "https://jaipur.manipal.edu/",
      degree: "Ph.D. in Computer Engineering",
      location: "Jaipur, India",
      start: "Jul 2013",
      end: "Dec 2019",
      gpa: "9.62",
      description:
        "Research focus: Secure localization and malicious node detection in wireless/ad-hoc networks.",
    },
    {
      school: "ISIM, University of Mysore",
      url: "https://uni-mysore.ac.in/Kannada/home.php",
      degree: "M.Tech. in Information Technology",
      location: "Mysuru, India",
      start: "",
      end: "Jul 2012",
      gpa: "62%",
      description:
        "Thesis: Localization in Wireless Networks in the presence of Cheating Beacon Nodes.",
    },
    {
      school: "Jeppiaar Engineering College (Anna University)",
      url: "https://jeppiaarcollege.org/jeppiaar/",
      degree: "B.Tech. in Information Technology",
      location: "Chennai, India",
      start: "",
      end: "May 2010",
      gpa: "68%",
      description: "",
    },
  ],

  projects: [
    {
      title: "ALLaM - Arabic Large Language Model",
      description:
        "End-to-end LLM development including 50TB data processing, LLaMA-2 pretraining strategies, curriculum SFT, DPO, and inference optimization for 7B/13B/70B models on Kubernetes.",
      technologies: [
        "PyTorch",
        "vLLM",
        "TGI",
        "Kubernetes",
        "Ray",
        "Azure",
        "Data-Juicer",
      ],
      type: "work",
      company: "SDAIA",
    },
    {
      title: "Phoenix - NLP Information Extraction Platform",
      description:
        "Generic NLP IE platform using BERT + hybrid CNN + Bloom embeddings achieving ~90% accuracy and saving ~100,000 man-hours/year. Includes LightGBM post-prediction and BART-based spell checking.",
      technologies: ["BERT", "CNN", "LightGBM", "LSTM", "BART", "FastAPI"],
      type: "work",
      company: "Mizuho Bank",
    },
    {
      title: "PIGEON - Document Classification & Summarization",
      description:
        "Document classification with RoBERTa and summarization using GPT-2/GPT Neo, achieving 97% accuracy with full API productionization.",
      technologies: ["RoBERTa", "GPT-2", "GPT Neo", "FastAPI"],
      type: "work",
      company: "Mizuho Bank",
    },
    {
      title: "SWAN - AML Name Check System",
      description:
        "Anti-Money Laundering name check system that reduced false positives by 20% using vector DB for embeddings and graph neural networks for anomaly detection.",
      technologies: ["Vector DB", "Graph Neural Networks", "NLP"],
      type: "work",
      company: "Mizuho Bank",
    },
    {
      title: "HAWK - Time-Series Forecasting",
      description:
        "Hybrid encoder-decoder LSTM for daily/weekly/monthly forecasts, saving ~3,000 man-hours/year with external data ingestion and ELK stack.",
      technologies: ["LSTM", "Encoder-Decoder", "ELK Stack"],
      type: "work",
      company: "Mizuho Bank",
    },
    {
      title: "Agentic RAG & Multi-Agent Orchestration",
      description:
        "Implemented agentic RAG and multi-agent planning/orchestration using LangChain, LangGraph, and Dify for government environments.",
      technologies: ["LangChain", "LangGraph", "Dify", "RAG"],
      type: "work",
      company: "SDAIA",
    },
    {
      title: "User Analytics Platform",
      description:
        "Built analytics platform for LLM chat telemetry using ClickHouse for ingest/OLAP, DuckDB for ad-hoc queries, delivering product insights and quality metrics.",
      technologies: ["ClickHouse", "DuckDB", "Polars", "Plotly"],
      type: "work",
      company: "SDAIA",
    },
  ],

  publications: [
    {
      title: "ALLaM: Large Language Models for Arabic and English",
      authors: "Bari M. S., Kuriakose J., et al.",
      journal: "The International Conference on Learning Representations (ICLR)",
      year: "2025",
      url: "https://doi.org/10.48550/arXiv.2407.15390",
    },
    {
      title:
        "A review of deep learning-based approaches for detection and diagnosis of diverse classes of drugs",
      authors: "Kuriakose J., et al.",
      journal: "Archives of Computational Methods in Engineering (Springer)",
      year: "2023",
      url: "https://scholar.google.com/citations?user=qRQlmIoAAAAJ",
    },
    {
      title:
        "EMBN-MANET: Eliminating Malicious Beacon Nodes in UWB-based Mobile Ad-Hoc Networks",
      authors: "Kuriakose J., Joshi S., Bairwa A. K.",
      journal: "Ad Hoc Networks (Elsevier)",
      year: "2022",
      url: "https://scholar.google.com/citations?user=qRQlmIoAAAAJ",
    },
    {
      title: "Secure Multipoint Relay Node Selection in Mobile Ad Hoc Networks",
      authors: "Kuriakose J., Amruth V., Raju R. V.",
      journal: "Communications in Computer and Information Science (Springer)",
      year: "2015",
      url: "https://scholar.google.com/citations?user=qRQlmIoAAAAJ",
    },
    {
      title: "A Review on Mobile Sensor Localization",
      authors: "Kuriakose J., et al.",
      journal: "Security in Computing and Communications (Springer)",
      year: "2014",
      url: "https://scholar.google.com/citations?user=qRQlmIoAAAAJ",
    },
  ],

  awards: [
    {
      title: "Project of the Year",
      organization: "Mizuho Bank",
      location: "Singapore",
      date: "Jul 2022",
    },
    {
      title: "Employee of the Month",
      organization: "Mizuho Bank",
      location: "Singapore",
      date: "Oct 2019, May 2021, Jul 2021",
    },
    {
      title: "Honourable Award - AML Project",
      organization: "Mizuho Bank",
      location: "Singapore",
      date: "Feb 2020",
    },
    {
      title: "Honourable Mention - Phoenix Project",
      organization: "Mizuho Bank",
      location: "Singapore",
      date: "Dec 2020",
    },
  ],

  languages: ["English", "Hindi", "Tamil", "Malayalam"],
} as const;
