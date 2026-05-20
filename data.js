/* ============================================================
   anupama.dev — Site Content Data
   Edit this file to update site content without touching the
   main script or HTML.
   ============================================================ */

window.SITE_DATA = {

  // ── Hero headline phrases (cycle with scramble effect) ────
  heroPhrases: [
    { line1: 'Your Competitor',        line2: 'Already Has AI'            },
    { line1: 'Got an Idea?',            line2: "Let's Build It"            },
    { line1: 'More Sales,',            line2: 'Less Manual Work'          },
    { line1: 'What If Your App',       line2: 'Ran Itself?'               },
    { line1: 'Stop Losing Customers',  line2: 'to Slow Software'          },
    { line1: 'Your Business,',         line2: 'Powered by AI'             },
  ],

  // ── Stats bar ─────────────────────────────────────────────
  stats: [
    { count: 6,  suffix: '+', label: 'Years Experience'    },
    { count: 20, suffix: '+', label: 'Projects Delivered'  },
    { count: 5,  suffix: '+', label: 'Enterprise Clients'  },
    { count: 4,  suffix: '',  label: 'AI Solutions Deployed' },
  ],

  // ── Services ──────────────────────────────────────────────
  // iconPath: the SVG <path>/<rect>/etc. inner content (without the outer <svg>)
  services: [
    {
      iconPath: '<path d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>',
      title: 'AI &amp; ML Integration',
      desc:  'Embed intelligent automation into your workflows — computer vision, NLP, predictive analytics, and generative AI solutions tailored for real business outcomes.',
      list:  ['Computer Vision &amp; Image AI', 'NLP &amp; Generative AI', 'Predictive Analytics', 'Edge AI Deployment'],
    },
    {
      iconPath: '<rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8M12 17v4"/>',
      title: 'Full-Stack Web Apps',
      desc:  'Modern, performant web applications built with React, Angular, Node.js, and Java — engineered for speed, security, and scale from day one.',
      list:  ['React &amp; Angular SPAs', 'Node.js / Java Backends', 'RESTful &amp; GraphQL APIs', 'E-commerce Platforms'],
    },
    {
      iconPath: '<path d="M3 15a4 4 0 0 0 4 4h9a5 5 0 0 0 1.8-9.7 6 6 0 0 0-11.6 1.7A4 4 0 0 0 3 15z"/>',
      title: 'Cloud &amp; DevOps',
      desc:  'Design and deploy cloud-native architectures on AWS, Azure, and GCP with automated CI/CD pipelines, containerisation, and infrastructure as code.',
      list:  ['AWS / Azure / GCP', 'Docker &amp; Kubernetes', 'CI/CD Pipelines', 'Infrastructure as Code'],
    },
    {
      iconPath: '<rect width="7" height="12" x="2" y="6" rx="1"/><rect width="7" height="12" x="15" y="6" rx="1"/><path d="M9 12h6"/>',
      title: 'Mobile Development',
      desc:  'Cross-platform mobile applications with Flutter and Kotlin delivering native performance and polished UX on both iOS and Android.',
      list:  ['Flutter Cross-Platform', 'Native Android (Kotlin)', 'IoT &amp; Wearable Integration', 'Offline-First Architecture'],
    },
    {
      iconPath: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>',
      title: 'Enterprise Solutions',
      desc:  'Mission-critical systems built to government and enterprise standards — ERP integrations, Salesforce migrations, compliance-grade security, and legacy modernisation.',
      list:  ['ERP Integrations (IFS, SAP)', 'Salesforce to Modern Stack', 'Compliance-Grade Security', 'Legacy Modernisation'],
    },
    {
      iconPath: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
      title: 'Tech Consulting',
      desc:  'Strategic technology advice — architecture reviews, AI roadmapping, stack selection, and code audits to align your tech investment with business goals.',
      list:  ['Architecture Reviews', 'AI Strategy &amp; Roadmapping', 'Stack Selection', 'Security &amp; Code Audits'],
    },
  ],

  // ── Work grid projects (the 2×2 card grid) ───────────────
  // imageClass: the BEM modifier on project-card__image (for CSS theming)
  // imageSrc: path relative to the anupama-dev folder
  // tags: shown in the overlay on hover
  // linkLabel: button text ('View Project' | 'View Live' | etc.)
  projects: [
    {
      imageClass: 'project-card__image--wecare',
      imageSrc:   'assets/projects/wecare/1.png',
      imageAlt:   'WeCare app screenshot',
      tags:       ['Edge AI', 'Flutter', 'IoT'],
      category:   'Healthcare &amp; AI',
      title:      'WeCare — Elderly Monitoring System',
      desc:       'Edge AI system for real-time fall detection and elderly monitoring using Raspberry Pi and wearable sensors. Privacy-first, on-device ML processing. Published research.',
      link:       'https://github.com/anupama4you/wecare',
      linkLabel:  'View Project',
    },
    {
      imageClass: 'project-card__image--cropsense',
      imageSrc:   'assets/projects/cropsense/1.png',
      imageAlt:   'CropSense app screenshot',
      tags:       ['Deep Learning', 'React', 'Flask'],
      category:   'Agriculture &amp; AI',
      title:      'CropSense — Crop Disease Detection',
      desc:       'AI-powered leaf disease detection with image classification, confidence scoring, and actionable treatment recommendations for farmers and growers. Published research.',
      link:       'https://github.com/anupama4you/Cropsense_',
      linkLabel:  'View Project',
    },
    {
      imageClass: 'project-card__image--zeil',
      imageSrc:   'assets/projects/zeil/1.png',
      imageAlt:   'ZEIL Shopify theme screenshot',
      tags:       ['Shopify', 'Liquid', 'E-commerce'],
      category:   'E-Commerce',
      title:      'ZEIL — Premium Shopify Theme',
      desc:       'Conversion-optimised Shopify theme with mobile-first design, built-in upsells, urgency triggers, and seamless review app integrations for lifestyle brands.',
      link:       'https://github.com/anupama4you/zeil',
      linkLabel:  'View Project',
    },
    {
      imageClass: 'project-card__image--devest',
      imageSrc:   'assets/projects/devest/1.jpg',
      imageAlt:   'DEVEST website screenshot',
      tags:       ['Laravel', 'Bilingual', 'RTL'],
      category:   'Web Development',
      title:      'DEVEST — Bilingual Company Website',
      desc:       'Fully dynamic bilingual company website with English &amp; Arabic support, RTL architecture, admin dashboard, blog system, and portfolio showcase built on Laravel.',
      link:       'https://devest.co',
      linkLabel:  'View Live',
    },
    {
      imageClass: 'project-card__image--ytdrop',
      imageSrc:   'assets/blog-images/chatgpt-image-may-2-2026-02_37_41-am.png',
      imageAlt:   'YTDrop YouTube downloader screenshot',
      tags:       ['Node.js', 'yt-dlp', 'Self-hosted'],
      category:   'Developer Tool · Live',
      title:      'YTDrop — Clean YouTube Downloader',
      desc:       'Ad-free, sign-up-free YouTube video and audio downloader. No sketchy redirects, no pop-ups — just paste a URL and download. Built for speed and simplicity.',
      link:       '#',
      linkLabel:  'View Project',
    },
    {
      imageClass: 'project-card__image--ellie',
      imageSrc:   'assets/ellie/dashboard.png',
      imageAlt:   'Ellie AI Receptionist dashboard',
      tags:       ['VAPI', 'GPT-4o', 'Netlify'],
      category:   'AI Product · Live',
      title:      'Ellie — AI Receptionist for Small Business',
      desc:       'AI-powered phone receptionist that answers every call 24/7, books appointments, and sends SMS confirmations. Personalises to any business via live website scraping.',
      link:       'ellie.html',
      linkLabel:  'Meet Ellie',
    },
  ],

  // ── Contact form ──────────────────────────────────────────
  // Sign up free at formspree.io → create a form → paste the endpoint below.
  // Example: 'https://formspree.io/f/xrgjzpqw'
  // Leave empty to fall back to a mailto: link.
  formEndpoint: '',

  // ── Tech stack ────────────────────────────────────────────
  techStack: [
    { label: 'Languages',        pills: ['Java', 'Python', 'TypeScript', 'C#', 'Dart', 'Kotlin', 'PHP'] },
    { label: 'Frontend',         pills: ['React', 'Angular', 'Flutter', 'Next.js', 'Tailwind CSS'] },
    { label: 'Backend &amp; APIs', pills: ['Node.js', 'Express', 'Spring Boot', 'ASP.NET', 'Laravel', 'Flask', 'GraphQL'] },
    { label: 'Cloud &amp; DevOps', pills: ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD'] },
    { label: 'AI &amp; Data',      pills: ['PyTorch', 'TensorFlow', 'OpenCV', 'Hugging Face', 'Google Gemini'] },
    { label: 'Databases',        pills: ['PostgreSQL', 'MySQL', 'MongoDB', 'Firebase', 'Oracle SQL', 'SQLite'] },
  ],

};
