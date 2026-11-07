import type { IconType } from "react-icons";
import {
  FaBook,
  FaBrain,
  FaBullseye,
  FaCamera,
  FaComments,
  FaCompass,
  FaEdit,
  FaGamepad,
  FaImages,
  FaLaptopCode,
  FaMagic,
  FaMicrophoneAlt,
  FaRobot,
  FaRocket,
  FaStar,
  FaTheaterMasks,
  FaTrophy,
  FaUser,
} from "react-icons/fa";

type Timeline = {
  year: string;
  role: string;
  company: string;
  description: string;
};
type Qualification = {
  year: string;
  degree: string;
  institution: string;
  description: string;
};
type SkillCategory = { name: string; skills: string[] };
type Project = {
  title: string;
  description: string;
  technologies: string[];
  link: string;
};
type Hobby = { name: string; description: string; icon: IconType };
type Goal = { title: string; description: string; timeline: string };
type GalleryImage = {
  url: string;
  caption: string;
  width: number;
  height: number;
};

export type PortfolioSection = {
  id: string;
  title: string;
  icon: IconType;
  color: string;
  position: { x: number; y: number };
  content: {
    title: string;
    description: string;
    image?: string;
    details?: string[];
    timeline?: Timeline[];
    qualifications?: Qualification[];
    skillCategories?: SkillCategory[];
    projects?: Project[];
    hobbies?: Hobby[];
    goals?: Goal[];
    images?: GalleryImage[];
    form?: boolean;
    lobby?: boolean;
  };
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: IconType;
  unlocked: boolean;
  requiredVisits?: number;
  timeRequired?: number;
};

// Portfolio sections data
export const sections: PortfolioSection[] = [
  {
    id: "about",
    title: "About Me",
    icon: FaUser,
    color: "#6a11cb",
    position: { x: 20, y: 30 },
    content: {
      title: "About Michael Cecilio",
      description:
        "Michael Cecilio is a full-stack developer focused on modern web applications, backend engineering, AI integration, and custom agentic architectures. His interests include long-term AI memory, reasoner–executor systems, and multi-provider AI APIs alongside Next.js, TypeScript, Go, Rust, and SQL databases.",
      details: [
        "Full-Stack Developer • Backend Engineering • AI Integration",
        "GitHub: ceciliomichael | LinkedIn: ceciliomichael",
        "Building modern web experiences with Next.js, React, TypeScript, and mobile-first design, alongside cross-platform Flutter applications.",
        "Working with Go, Rust, TypeScript, PostgreSQL, SQLite, MongoDB, and Supabase for APIs, backend services, and data-driven applications.",
        "Integrating Claude, OpenAI, Gemini, and DeepSeek APIs with autonomous agents, tool calling, and multi-agent orchestration.",
        "Designing my own agent architectures, including long-term memory for sustained recall over extended interactions and a dual-agent system that separates semantic reasoning from execution.",
      ],
      image: "/images/profile/me.png",
    },
  },
  {
    id: "ai-expertise",
    title: "AI Expertise",
    icon: FaRobot,
    color: "#2575fc",
    position: { x: 70, y: 20 },
    content: {
      title: "AI Development Experience",
      description:
        "Designing custom AI agent architectures, including durable long-term memory and a reasoner–executor dual-agent pattern, alongside multi-provider AI APIs and tool-enabled workflows.",
      timeline: [
        {
          year: "AI API Integration",
          role: "Multi-Provider Language Model Integration",
          company: "Claude • OpenAI • Gemini • DeepSeek",
          description:
            "Integrating Claude (Anthropic), OpenAI, Gemini, and DeepSeek APIs into applications, including response handling, model selection, and structured AI workflows.",
        },
        {
          year: "Agentic Systems",
          role: "Autonomous AI Agents & Tool Use",
          company: "Planning • Tools • Orchestration",
          description:
            "Building agentic workflows where models can plan tasks, invoke tools and APIs, handle intermediate results, and coordinate multiple steps.",
        },
        {
          year: "Custom Architecture",
          role: "Long-Term Memory Architecture",
          company: "Persistent Context • Sustained Recall",
          description:
            "Designing my own long-term memory architecture to help AI systems retain important context and recall relevant information reliably throughout extended interactions, rather than forgetting earlier details as conversations grow.",
        },
        {
          year: "Dual-Agent Design",
          role: "Reasoner–Executor Dual-Agent Architecture",
          company: "Semantic Reasoning • Dedicated Execution",
          description:
            "A two-agent architecture in which a reasoner LLM focuses on understanding and reasoning about the task semantically, while a separate executor agent acts only on the semantic instructions produced by the reasoner. This separates deciding what should happen from performing the requested actions.",
        },
        {
          year: "Multi-Agent AI",
          role: "Agent Communication & Collaboration",
          company: "Multi-Agent Workflows",
          description:
            "Exploring communication between specialized agents, delegated responsibilities, and orchestration patterns for connected AI systems.",
        },
        {
          year: "Applied AI",
          role: "AI-Powered Web & Mobile Applications",
          company: "Next.js • APIs • Flutter",
          description:
            "Connecting language-model capabilities to web and mobile interfaces through application backends, API integrations, and conversational experiences.",
        },
        {
          year: "LLM Engineering",
          role: "Prompting, Context & Response Design",
          company: "Prompt Engineering • LLM Workflows",
          description:
            "Working with prompt design, context management, structured responses, and iterative refinement to make AI-assisted features more useful and reliable.",
        },
        {
          year: "Full-Stack AI",
          role: "AI Integration Across Application Layers",
          company: "TypeScript • Backend APIs • Databases",
          description:
            "Integrating AI workflows with application logic, backend services, and databases rather than limiting AI features to a standalone chat interface.",
        },
      ],
    },
  },
  {
    id: "technical-skills",
    title: "Technical Skills",
    icon: FaLaptopCode,
    color: "#17a2b8",
    position: { x: 45, y: 60 },
    content: {
      title: "My Technical Toolkit",
      description:
        "A growing engineering toolkit across full-stack development, backend systems, databases, cross-platform apps, AI APIs, and autonomous agents.",
      skillCategories: [
        {
          name: "Frontend & Full Stack",
          skills: [
            "Next.js",
            "React",
            "TypeScript",
            "JavaScript",
            "HTML5 & CSS3",
            "Tailwind CSS",
            "Server-Side Rendering",
            "API Integration",
          ],
        },
        {
          name: "Backend Engineering",
          skills: [
            "Go (Golang)",
            "Rust",
            "TypeScript",
            "Node.js",
            "Express",
            "REST APIs",
            "Server-Side Logic",
            "Database Integration",
          ],
        },
        {
          name: "Databases & Data",
          skills: [
            "PostgreSQL",
            "SQLite",
            "MongoDB",
            "Supabase",
            "SQL",
            "Data Modeling",
            "Application Persistence",
          ],
        },
        {
          name: "AI APIs & Integration",
          skills: [
            "Claude API (Anthropic)",
            "OpenAI API",
            "Gemini API",
            "DeepSeek API",
            "LLM Integration",
            "Structured Outputs",
            "Prompt Engineering",
          ],
        },
        {
          name: "Autonomous & Agentic AI",
          skills: [
            "AI Agent Development",
            "Custom Agent Architecture",
            "Long-Term Memory Architecture",
            "Reasoner–Executor Dual-Agent Systems",
            "Semantic Reasoning & Execution",
            "Tool Calling",
            "Multi-Agent Systems",
            "Workflow Orchestration",
            "Task Planning",
            "API-Enabled Agents",
            "Context Management",
          ],
        },
        {
          name: "Mobile & Development Tools",
          skills: [
            "Flutter",
            "Dart",
            "Mobile-First Design",
            "Responsive Interfaces",
            "Accessibility",
            "Git & GitHub",
            "Docker",
          ],
        },
      ],
    },
  },
  {
    id: "development",
    title: "Development",
    icon: FaRocket,
    color: "#ff7e5f",
    position: { x: 25, y: 75 },
    content: {
      title: "Development Experience",
      description:
        "Developing full-stack web applications, mobile-first interfaces, Flutter apps, backend services in Go, Rust, and TypeScript, and integrated autonomous AI systems.",
      qualifications: [
        {
          year: "Full Stack",
          degree: "Full Stack Development",
          institution: "Next.js • React • TypeScript • SQL",
          description:
            "Building end-to-end applications with Next.js, React, TypeScript, Tailwind CSS, and backend APIs. Working across Node.js and Go services with PostgreSQL, SQLite, MongoDB, and Supabase for data persistence and integration.",
        },
        {
          year: "Mobile First",
          degree: "Mobile-First Web Development",
          institution: "Responsive Web Applications",
          description:
            "Designing and building accessible, touch-friendly interfaces that prioritize mobile devices, with responsive layouts, fluid typography, and seamless experiences across screen sizes.",
        },
        {
          year: "Cross-Platform",
          degree: "Flutter Development",
          institution: "Mobile Applications",
          description:
            "Building cross-platform mobile applications with Flutter and Dart, focusing on reusable components, responsive interfaces, API integration, and AI-powered mobile experiences.",
        },
        {
          year: "Agentic AI",
          degree: "Autonomous Agentic Systems",
          institution: "Custom Architecture • Memory • Dual Agents",
          description:
            "Designing my own agentic architectures, including long-term memory intended to sustain strong contextual recall across extended interactions, and a dual-agent reasoner–executor design: one LLM reasons semantically about the task, while a separate agent executes only the resulting semantic instructions. Also working with tool use and multi-agent orchestration.",
        },
        {
          year: "AI Integration",
          degree: "AI API & Agentic Integrations",
          institution: "Claude • OpenAI • Gemini • DeepSeek",
          description:
            "Integrating Claude (Anthropic), OpenAI, Gemini, and DeepSeek APIs into applications, including tool calling, structured model responses, multi-provider AI features, and agentic workflows connected to backend services.",
        },
        {
          year: "Backend Development",
          degree: "Backend Development",
          institution: "Rust • Go (Golang) • TypeScript • Node.js",
          description:
            "Building APIs and backend services using Rust, Go, TypeScript, and Node.js, with REST endpoints, database access, PostgreSQL and SQLite, and reliable server-side application logic.",
        },
      ],
    },
  },
  {
    id: "projects",
    title: "Projects",
    icon: FaMagic,
    color: "#9147ff",
    position: { x: 75, y: 70 },
    content: {
      title: "Featured Projects",
      description:
        "Selected projects spanning self-hosted application infrastructure, privacy-first browser tools, and AI-assisted desktop development.",
      projects: [
        {
          title: "RouteGate",
          description:
            "A self-hosted platform for deploying, exposing, and managing applications from one dashboard. RouteGate brings source-based deployments, public routes, runtime logs, isolated development workspaces, and resource-efficient workload management together. Cloudflare Tunnel provides public ingress while the RouteGate router directs traffic to hosted applications.",
          technologies: [
            "Self-Hosted Infrastructure",
            "Application Deployments",
            "Cloudflare Tunnel",
            "Routing",
            "Development Workspaces",
            "MCP",
          ],
          link: "https://dash.routegate.cc",
        },
        {
          title: "PageCut",
          description:
            "A simple, privacy-focused PDF tool for splitting, extracting, and merging documents entirely in the browser. PageCut supports custom page ranges and filenames, drag-and-drop file reordering, and adjustable workflows without re-uploading. Files are processed locally and never sent to a remote server.",
          technologies: [
            "Client-Side PDF Processing",
            "Split & Merge",
            "Privacy by Design",
            "Drag & Drop",
            "Document Workflows",
          ],
          link: "https://pagecut.routegate.cc",
        },
        {
          title: "TideCode",
          description:
            "A desktop AI development workspace that keeps conversations, project files, an editor, terminal, planning board, and Git changes together. TideCode supports agent and planning workflows, reviewable diffs, configurable AI model providers, MCP tools, and reusable skills to reduce context switching while building software.",
          technologies: [
            "Desktop Application",
            "AI Development Workspace",
            "Agent & Plan Modes",
            "Git Integration",
            "MCP",
            "Multi-Provider AI",
          ],
          link: "https://tidecode.routegate.cc",
        },
      ],
    },
  },
  {
    id: "hobbies",
    title: "Hobbies",
    icon: FaGamepad,
    color: "#ffc107",
    position: { x: 60, y: 40 },
    content: {
      title: "Beyond Coding",
      description:
        "When I'm not immersed in code, you can find me enjoying these activities.",
      hobbies: [
        {
          name: "AI Experimentation",
          description:
            "I enjoy creating my own AI agent architectures, particularly long-term memory systems and dual-agent designs that separate semantic reasoning from execution.",
          icon: FaRobot,
        },
        {
          name: "Reading Tech Blogs",
          description:
            "Staying updated with the latest in technology and AI development.",
          icon: FaBook,
        },
        {
          name: "Singing",
          description:
            "Enjoy singing and performing vocal music in my free time.",
          icon: FaMicrophoneAlt,
        },
        {
          name: "Broadway & Musicals",
          description:
            "Love listening to and experiencing Broadway shows and musical theater.",
          icon: FaTheaterMasks,
        },
      ],
    },
  },
  {
    id: "goals",
    title: "Goals",
    icon: FaBullseye,
    color: "#dc3545",
    position: { x: 30, y: 15 },
    content: {
      title: "My Future Aspirations",
      description:
        "Continuing to grow as a full-stack, backend, and agentic AI developer, with a focus on reliable systems and practical applications.",
      goals: [
        {
          title: "Further develop expertise in Large Language Models",
          description:
            "Expand knowledge in neural network architectures and transformers.",
          timeline: "Ongoing",
        },
        {
          title: "Advance as an AI Engineer",
          description:
            "Continue developing skills in AI engineering to build more sophisticated AI systems.",
          timeline: "Current focus",
        },
        {
          title: "Deliver useful AI-powered applications",
          description:
            "Connect modern model APIs and autonomous workflows to real user needs through full-stack applications.",
          timeline: "Current focus",
        },
        {
          title: "Master prompt engineering techniques",
          description:
            "Refine abilities to maximize AI potential through advanced prompting methodologies.",
          timeline: "Ongoing",
        },
        {
          title: "Build more reliable agentic AI systems",
          description:
            "Keep refining my long-term memory architecture for sustained contextual recall and the separation between semantic reasoning and execution in my dual-agent design.",
          timeline: "Next 2 years",
        },
        {
          title: "Deepen full-stack and backend engineering",
          description:
            "Keep advancing Next.js and TypeScript development alongside Rust, Go, PostgreSQL, SQLite, and AI integrations.",
          timeline: "Current focus",
        },
        {
          title: "Balance academic studies with AI project development",
          description:
            "Continue academic learning while applying knowledge to practical AI projects.",
          timeline: "Ongoing",
        },
      ],
    },
  },
  {
    id: "gallery",
    title: "Gallery",
    icon: FaImages,
    color: "#6f42c1",
    position: { x: 85, y: 40 },
    content: {
      title: "Visual Showcase",
      description:
        "A collection of images from my work, travels, and creative endeavors.",
      images: [
        {
          url: "/images/gallery/image1.png",
          caption: "Minecraft with friends",
          width: 1066,
          height: 616,
        },
        {
          url: "/images/gallery/image2.jpg",
          caption: "Chanel the cat",
          width: 1536,
          height: 2048,
        },
        {
          url: "/images/gallery/image3.jpg",
          caption: "Wednesday the cat",
          width: 1537,
          height: 2048,
        },
        {
          url: "/images/gallery/image4.jpg",
          caption: "My wallpaper blackhole",
          width: 2560,
          height: 1440,
        },
        {
          url: "/images/gallery/image5.png",
          caption: "HahTdog",
          width: 120,
          height: 63,
        },
        {
          url: "/images/gallery/image6.png",
          caption: "In the battle of PUBG with friend",
          width: 1098,
          height: 1213,
        },
      ],
    },
  },
  {
    id: "photobooth",
    title: "Photobooth",
    icon: FaCamera,
    color: "#f0a6d2",
    position: { x: 80, y: 88 },
    content: {
      title: "Orbit Booth",
      description:
        "Capture or upload one to four photos, edit your film strip, and save it as a PNG. Everything stays on your device.",
    },
  },
  {
    id: "feedback",
    title: "Feedback",
    icon: FaComments,
    color: "#20c997",
    position: { x: 50, y: 85 },
    content: {
      title: "Share Your Thoughts",
      description:
        "A public guestbook for sharing your thoughts. Each explorer can publish one feedback post and revise it up to three times, with live updates for everyone.",
      form: true,
    },
  },
  {
    id: "lobby",
    title: "Lobby",
    icon: FaMicrophoneAlt,
    color: "#fd7e14",
    position: { x: 90, y: 15 },
    content: {
      title: "Visitor Lobby",
      description:
        "Join a live, shared conversation with other visitors. Messages update in real time.",
      lobby: true,
    },
  },
];
// Achievements data
export const achievements: Achievement[] = [
  {
    id: "first_visit",
    title: "First Steps",
    description: "Visited the portfolio for the first time",
    icon: FaTrophy,
    unlocked: false,
  },
  {
    id: "explorer",
    title: "Explorer",
    description: "Visited at least 5 different sections",
    icon: FaCompass,
    unlocked: false,
    requiredVisits: 5,
  },
  {
    id: "trailblazer",
    title: "Trailblazer",
    description: "Discovered 3 constellation sections",
    icon: FaRocket,
    unlocked: false,
    requiredVisits: 3,
  },
  {
    id: "curious_mind",
    title: "Curious Mind",
    description: "Spent more than 5 minutes exploring",
    icon: FaBrain,
    unlocked: false,
    timeRequired: 5 * 60 * 1000, // 5 minutes in milliseconds
  },
  {
    id: "first_message",
    title: "First Transmission",
    description: "Sent your first message in the lobby",
    icon: FaComments,
    unlocked: false,
  },
  {
    id: "feedback_giver",
    title: "Feedback Giver",
    description: "Submitted feedback",
    icon: FaEdit,
    unlocked: false,
  },
  {
    id: "completionist",
    title: "Completionist",
    description: "Visited all sections of the portfolio",
    icon: FaStar,
    unlocked: false,
  },
];
