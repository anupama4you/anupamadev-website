# anupama.dev

Personal portfolio and business website for Anupama Dilshan — AI & software solutions based in Adelaide, Australia.

Built with vanilla HTML, CSS, and JavaScript. No frameworks, no build tools, no dependencies.

## Project Structure

```
anupama-dev/
├── index.html        # Main HTML structure and content
├── style.css         # All styling (dark/light themes, animations)
├── script.js         # Navigation, canvas animation, scroll effects, counters
├── data.js           # Site content — edit this to update text, projects, and services
└── assets/
    └── projects/     # Portfolio project images and PDFs
        ├── wecare/
        ├── cropsense/
        ├── devest/
        └── zeil/
```

## Running Locally

Open `index.html` directly in a browser, or serve it with any static file server:

```bash
python -m http.server 8000
# Visit http://localhost:8000
```

## Updating Content

All site content is configured in [data.js](data.js):

- `heroPhrases` — rotating headline text in the hero section
- `stats` — animated statistics bar (years, projects, clients)
- `services` — service cards with descriptions and feature lists
- `projects` — portfolio grid with images, tags, and links
- `techStack` — technology pills grouped by category
- `formEndpoint` — Formspree endpoint for the contact form

## Features

- Dark / light theme toggle (persisted in localStorage)
- Animated neural network canvas with mouse interactivity
- Scroll-triggered counter animations and element reveals
- Responsive mobile menu
- Contact form via [Formspree](https://formspree.io) (configure `formEndpoint` in `data.js`)

## Tech Stack

**Frontend:** HTML5, CSS3 (custom properties, grid, flexbox), JavaScript ES6+

**AI / ML projects showcased:** PyTorch, TensorFlow, OpenCV, Google Gemini, Hugging Face

**Web projects showcased:** React, Angular, Flutter, Node.js, Spring Boot, Laravel, Flutter

**Cloud:** AWS, Azure, GCP, Docker, Kubernetes

## Deployment

This is a fully static site — no build step required.

- **GitHub Pages:** push to `main`, enable Pages in repo settings
- **Netlify:** drag and drop the project folder
- **Traditional hosting:** upload files via FTP
