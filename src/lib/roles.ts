export type RoleCategory = 'Tech' | 'HR' | 'Non-Tech' | 'Other';

export interface ScoringDimension {
  name: string;
  description: string;
}

export interface RoleConfig {
  id: string;
  label: string;
  category: RoleCategory;
  competencies: string[];
  topicAreas: string[];
  interviewStyle: string;
  scoringDimensions: ScoringDimension[];
  sampleScenarios: string[];
}

export const PRESET_ROLE_CONFIGS: RoleConfig[] = [
  // ==========================================
  // TECH ROLES (14)
  // ==========================================
  {
    id: 'frontend-developer',
    label: 'Frontend Developer',
    category: 'Tech',
    competencies: [
      'Modern JavaScript / TypeScript & ESNext',
      'React / Next.js component architecture & hooks lifecycle',
      'State management (Zustand, Redux, Context API)',
      'Web performance (Core Web Vitals, SSR/SSG, code splitting, memoization)',
      'Responsive UI / CSS frameworks (Tailwind, CSS Modules, CSS-in-JS)',
      'Browser rendering pipeline & DOM optimization',
      'Client-side security (XSS, CSRF, CSP, secure token handling)',
      'Testing (Jest, React Testing Library, Playwright, Cypress)'
    ],
    topicAreas: [
      'Component lifecycle and re-render optimization',
      'Hydration mismatch debugging in Next.js',
      'Optimizing LCP, CLS, and INP metrics',
      'Accessibility (a11y, ARIA attributes, semantic HTML)',
      'Micro-frontends vs Monorepo setups',
      'API integration (REST, GraphQL, WebSocket streaming, optimistic UI)'
    ],
    interviewStyle: 'Practical engineering scenarios, architecture trade-offs, real debugging stories, and UI performance audits. Avoid trivia.',
    scoringDimensions: [
      { name: 'Component & State Architecture', description: 'Clean abstraction, reusable components, and predictable state flow' },
      { name: 'Performance & Optimization', description: 'Core Web Vitals, rendering pipeline, caching, and bundle size control' },
      { name: 'Debugging & Problem Solving', description: 'Root cause analysis of UI bugs, memory leaks, and hydration issues' },
      { name: 'Modern Web Standards & a11y', description: 'TypeScript proficiency, semantic accessibility, and cross-browser consistency' }
    ],
    sampleScenarios: [
      'A complex dashboard page experiences sluggish scrolling and re-renders 50 components on every keystroke. How do you diagnose and fix it?',
      'You are shipping an infinite scroll list with images that crashes mobile browsers after 200 items. Walk me through your solution.',
      'How do you handle an intermittent hydration error occurring only in production in a Next.js App Router project?'
    ]
  },
  {
    id: 'backend-developer',
    label: 'Backend Developer',
    category: 'Tech',
    competencies: [
      'REST & gRPC API design, versioning, and contract management',
      'Relational & NoSQL databases (indexing, queries, normalization, migrations)',
      'Distributed systems (caching, message brokers like Kafka/RabbitMQ)',
      'Concurrency, async processing, and thread safety',
      'Authentication, RBAC/ABAC, OAuth2, and JWT lifecycle',
      'Observability (distributed tracing, structured logging, APM)',
      'API rate limiting, idempotency, and resilient retry patterns'
    ],
    topicAreas: [
      'Database query optimization, EXPLAIN ANALYZE, and connection pooling',
      'Microservice communication and handling eventual consistency',
      'Preventing race conditions in financial / inventory transactions',
      'Designing idempotent webhook consumers',
      'High-throughput message consumption and backpressure handling',
      'Zero-downtime database migrations'
    ],
    interviewStyle: 'System design trade-offs, transactional integrity scenarios, concurrency bug debugging, and production failure recovery.',
    scoringDimensions: [
      { name: 'API & Architecture Design', description: 'Clean endpoints, separation of concerns, and scalable service modularity' },
      { name: 'Data Modeling & Query Performance', description: 'Database schema, indexing, deadlock prevention, and caching strategies' },
      { name: 'System Resilience & Scalability', description: 'Fault tolerance, backpressure, rate-limiting, and idempotency handling' },
      { name: 'Security & Transactional Integrity', description: 'ACID guarantees, secure authorization, and vulnerability mitigation' }
    ],
    sampleScenarios: [
      'Two users attempt to purchase the very last available concert ticket at the exact same millisecond. How do you guarantee zero overselling?',
      'A critical downstream payment gateway is taking 15 seconds to respond or dropping requests. How do you protect your backend services from cascading failure?',
      'Your PostgreSQL database CPU hits 98% during a peak sale event. Walk me through your first 15 minutes of investigation and mitigation.'
    ]
  },
  {
    id: 'full-stack-developer',
    label: 'Full Stack Developer',
    category: 'Tech',
    competencies: [
      'End-to-end feature delivery (database to UI components)',
      'Full-stack TypeScript (Next.js, Node.js, Express, Fastify)',
      'Relational / NoSQL database modeling and ORM/query builders',
      'API design and client-server state synchronization',
      'DevOps basics (Docker, CI/CD, cloud deployment)',
      'Security across the full stack (sanitization, auth, HTTPS, CORS)'
    ],
    topicAreas: [
      'Designing end-to-end features with high velocity and maintainability',
      'Server-side rendering vs client-side fetching trade-offs',
      'Data flow management between database, cache, and frontend state',
      'Full-stack debugging across network, server logs, and browser console',
      'Automated testing strategies across unit, integration, and e2e'
    ],
    interviewStyle: 'Holistic product engineering scenarios, balancing developer speed with system robustness, and cross-layer trade-offs.',
    scoringDimensions: [
      { name: 'Full Stack Cohesion', description: 'Seamless data flow from database schema to responsive frontend' },
      { name: 'Technical Depth (Frontend & Backend)', description: 'Balanced competence across client performance and backend stability' },
      { name: 'Pragmatic Engineering & Speed', description: 'Sensible trade-offs, maintainable code, and production readiness' },
      { name: 'Troubleshooting Across the Stack', description: 'Pinpointing whether issues stem from network, DB, API, or UI' }
    ],
    sampleScenarios: [
      'You need to build a real-time collaborative document editing feature. How do you design both the backend synchronization and the frontend UI responsiveness?',
      'A user reports that submitted forms occasionally create duplicate rows in the database and display a timeout error. How do you fix this across the stack?'
    ]
  },
  {
    id: 'mobile-app-developer',
    label: 'Mobile App Developer',
    category: 'Tech',
    competencies: [
      'Native (Swift/iOS, Kotlin/Android) or Cross-platform (React Native, Flutter)',
      'Mobile app lifecycle, background tasks, and battery efficiency',
      'Offline-first architecture, local caching (SQLite, Room, CoreData)',
      'Push notifications, deep linking, and mobile analytics',
      'Memory management and preventing UI frame drops (60/120 fps)',
      'App Store & Play Store release pipelines and compliance'
    ],
    topicAreas: [
      'Handling flaky mobile networks and graceful offline sync',
      'Optimizing app startup time (cold/warm start) and bundle size',
      'Managing background location tracking without draining battery',
      'Handling OS memory kills and state restoration',
      'Cross-platform bridge performance vs native modules'
    ],
    interviewStyle: 'Device constraint problem-solving, real-world crash triage, and offline-first mobile UX challenges.',
    scoringDimensions: [
      { name: 'Mobile Architecture & Lifecycle', description: 'State management, background execution, and OS lifecycle handling' },
      { name: 'Offline Capability & Sync', description: 'Resilient local storage, conflict resolution, and background syncing' },
      { name: 'Performance & Smoothness', description: 'FPS preservation, memory leak prevention, and fast app launch' },
      { name: 'Native Platform Integration', description: 'Deep linking, permissions, push notifications, and store guidelines' }
    ],
    sampleScenarios: [
      'Your mobile app crashes on launch for 15% of Android users after an update. What telemetry do you inspect and how do you roll out a hotfix?',
      'Users complain that the app drains their phone battery when running in the background. How do you trace and eliminate the culprit?'
    ]
  },
  {
    id: 'software-engineer-general',
    label: 'Software Engineer (general)',
    category: 'Tech',
    competencies: [
      'Data structures and algorithm design',
      'Software design patterns and SOLID principles',
      'Clean code, modularity, and technical debt reduction',
      'System design fundamentals and trade-offs',
      'Version control (Git) workflows and code review standards',
      'Automated testing, CI/CD, and deployment pipelines'
    ],
    topicAreas: [
      'Refactoring legacy monolithic codebases into modular services',
      'Choosing optimal data structures for memory and compute constraints',
      'Designing extensible, maintainable APIs and class interfaces',
      'Writing effective unit and integration tests for critical logic',
      'Root-cause analysis for production regressions'
    ],
    interviewStyle: 'Algorithmic reasoning, clean code trade-offs, structured problem decomposition, and software craftsmanship.',
    scoringDimensions: [
      { name: 'Problem Solving & Algorithmic Rigor', description: 'Decomposing ambiguity into structured, efficient solutions' },
      { name: 'Code Quality & Design Principles', description: 'Clean architecture, SOLID patterns, readability, and extensibility' },
      { name: 'Testing & Reliability', description: 'Edge case consideration, defensive coding, and regression prevention' },
      { name: 'System Thinking', description: 'Understanding how individual modules interact in a larger infrastructure' }
    ],
    sampleScenarios: [
      'You are handed a 2,000-line legacy function with zero automated tests that processes payments and frequently breaks. How do you safely refactor it?',
      'Explain a time you had to choose between code readability and extreme performance. What did you decide and why?'
    ]
  },
  {
    id: 'data-analyst',
    label: 'Data Analyst',
    category: 'Tech',
    competencies: [
      'Advanced SQL (window functions, CTEs, subqueries, query optimization)',
      'Data visualization & BI tools (Tableau, Power BI, Looker)',
      'Data storytelling and executive dashboard design',
      'Business metrics (churn, retention, CAC, LTV, conversion funnels)',
      'Statistical foundations (hypothesis testing, confidence intervals, A/B testing)',
      'Data cleaning, transformation, and reconciliation (Python/Pandas, dbt)'
    ],
    topicAreas: [
      'Cohort analysis and user retention tracking over time',
      'Diagnosing sudden metric drops (e.g., why revenue dropped 18% week-over-week)',
      'A/B test evaluation, sample size determination, and significance',
      'Designing self-serve data models for business stakeholders',
      'Reconciling discrepancies between product analytics and transactional DBs'
    ],
    interviewStyle: 'Data puzzle scenarios, metric diagnosis drills, stakeholder communication, and SQL logic walk-throughs.',
    scoringDimensions: [
      { name: 'SQL & Analytical Acumen', description: 'Complex aggregations, windowing, and clean data modeling' },
      { name: 'Business Acumen & Metric Sense', description: 'Understanding commercial levers (CAC, LTV, churn, conversion)' },
      { name: 'Diagnostic Thinking', description: 'Methodical hypothesis generation when investigating metric anomalies' },
      { name: 'Data Storytelling & Stakeholder Comm', description: 'Translating complex data insights into actionable business advice' }
    ],
    sampleScenarios: [
      'The CEO alerts you that daily active users (DAU) dropped by 14% yesterday while signups stayed flat. Walk me through your step-by-step investigation.',
      'A product manager wants to roll out a new checkout flow based on an A/B test with 50 total conversions. How do you advise them regarding statistical power?'
    ]
  },
  {
    id: 'data-scientist-ml-engineer',
    label: 'Data Scientist / ML Engineer',
    category: 'Tech',
    competencies: [
      'Machine Learning algorithms (Supervised, Unsupervised, Reinforcement)',
      'Deep Learning & NLP / Computer Vision frameworks (PyTorch, TensorFlow)',
      'Feature engineering, model evaluation metrics (AUC, F1, RMSE, MAP)',
      'MLOps (model versioning, MLflow, CI/CD for models, drift detection)',
      'Production inference deployment, low-latency serving, and quantization',
      'LLM fine-tuning, RAG architecture, and prompt engineering'
    ],
    topicAreas: [
      'Addressing class imbalance in fraud detection / rare event prediction',
      'Detecting data drift and concept drift in production pipelines',
      'RAG pipeline evaluation: chunking, embedding models, vector retrieval, and reranking',
      'Offline model metrics vs online A/B testing business results',
      'Preventing data leakage during cross-validation and feature creation'
    ],
    interviewStyle: 'Rigorous ML system design, mathematical foundations, handling real-world dirty data, and production latency trade-offs.',
    scoringDimensions: [
      { name: 'ML Modeling & Evaluation', description: 'Algorithm selection, metric alignment, and leakage prevention' },
      { name: 'MLOps & Production Deployment', description: 'Serving pipelines, latency, drift monitoring, and retrain automation' },
      { name: 'GenAI & RAG Understanding', description: 'Context window management, retrieval quality, and hallucination reduction' },
      { name: 'Business Impact Alignment', description: 'Mapping technical model metrics to tangible business outcomes' }
    ],
    sampleScenarios: [
      'Your recommendation model achieves a 95% AUC on historical test data, but conversions plummet when rolled out live. What could be happening?',
      'Walk me through designing an enterprise semantic search system using embeddings and RAG for 100,000 PDF documents with strict low-latency constraints.'
    ]
  },
  {
    id: 'devops-cloud-engineer',
    label: 'DevOps / Cloud Engineer',
    category: 'Tech',
    competencies: [
      'Cloud platforms (AWS, GCP, Azure) core architecture',
      'Infrastructure as Code (Terraform, Pulumi, CloudFormation)',
      'Container orchestration (Kubernetes, Docker, Helm)',
      'CI/CD pipeline automation (GitHub Actions, GitLab CI, ArgoCD)',
      'Site Reliability Engineering (SLOs, SLIs, error budgets, incident response)',
      'Cloud security, IAM least privilege, and network isolation (VPC, subnets)'
    ],
    topicAreas: [
      'Designing zero-downtime blue/green and canary deployments in Kubernetes',
      'Managing Terraform state in multi-environment, multi-developer teams',
      'Production outage post-mortem: triage, rollback, and root cause analysis',
      'Cost optimization for cloud infrastructure (spot instances, rightsizing, egress)',
      'Automated disaster recovery and multi-region failover'
    ],
    interviewStyle: 'Production incident war-stories, infrastructure architecture trade-offs, security postures, and automation philosophy.',
    scoringDimensions: [
      { name: 'Infrastructure as Code & Automation', description: 'Modular Terraform, GitOps workflows, and repeatable configurations' },
      { name: 'Kubernetes & Container Mastery', description: 'Pod lifecycle, ingress, resource quotas, and cluster resilience' },
      { name: 'Reliability & Incident Management', description: 'Monitoring, alert design, incident triage, and blameless post-mortems' },
      { name: 'Cloud Security & Cost Efficiency', description: 'IAM policies, network hardening, secrets management, and FinOps' }
    ],
    sampleScenarios: [
      'At 2:00 AM on a Friday, your production Kubernetes cluster starts crash-looping after an automated Helm deployment. How do you respond?',
      'Your monthly AWS bill jumped from $15,000 to $45,000 without a 3x traffic spike. How do you find and resolve the runaway spend?'
    ]
  },
  {
    id: 'qa-test-engineer',
    label: 'QA / Test Engineer',
    category: 'Tech',
    competencies: [
      'Test automation frameworks (Playwright, Cypress, Selenium, Appium)',
      'API testing & contract validation (Postman, REST Assured, k6)',
      'Test strategy & test pyramid (unit, integration, e2e, smoke, regression)',
      'Performance, load, and stress testing concepts',
      'Bug reporting, root-cause reproduction, and defect life cycle',
      'CI/CD test integration and flaky test eradication'
    ],
    topicAreas: [
      'Designing automated regression suites that run under 10 minutes',
      'Identifying and stabilizing flaky UI test suites',
      'Testing asynchronous queues, third-party payment webhooks, and push notifications',
      'Security and boundary value edge-case exploration',
      'Collaborating with developers to build testable code architectures'
    ],
    interviewStyle: 'Edge-case scenario dissection, automation framework architecture, defect hunting, and quality culture advocacy.',
    scoringDimensions: [
      { name: 'Test Automation Engineering', description: 'Clean test code, Page Object Model, CI integration, and speed' },
      { name: 'Edge Case & Exploratory Mindset', description: 'Finding boundary conditions, race conditions, and obscure bugs' },
      { name: 'Defect Analysis & Reporting', description: 'Detailed reproduction steps, logs, network traces, and triage' },
      { name: 'Performance & Non-Functional Testing', description: 'Load testing, security checks, and concurrency validation' }
    ],
    sampleScenarios: [
      'You are testing an e-commerce checkout flow where a user applies a discount coupon, changes currency, and navigates back. What edge cases do you test?',
      'Your team’s automated test suite takes 2 hours to execute and fails 30% of the time due to flakiness. What is your roadmap to fix it?'
    ]
  },
  {
    id: 'cybersecurity-analyst',
    label: 'Cybersecurity Analyst',
    category: 'Tech',
    competencies: [
      'Threat detection, SIEM log analysis, and SOC operations',
      'Vulnerability assessment & penetration testing fundamentals',
      'Network security (firewalls, WAF, IDS/IPS, zero trust)',
      'Incident response lifecycle (identification, containment, eradication, recovery)',
      'OWASP Top 10 vulnerabilities and remediation techniques',
      'Security compliance frameworks (SOC 2, ISO 27001, GDPR, HIPAA)'
    ],
    topicAreas: [
      'Investigating suspicious PowerShell execution and lateral movement alerts',
      'Mitigating active phishing campaigns and business email compromise',
      'Securing cloud environments: misconfigured S3 buckets, exposed API keys',
      'Prioritizing vulnerability patches using CVSS scores and exploitability',
      'Creating incident response runbooks for ransomware outbreaks'
    ],
    interviewStyle: 'Incident investigation drills, threat hunting walk-throughs, risk evaluation, and security architecture defense.',
    scoringDimensions: [
      { name: 'Threat Detection & Analysis', description: 'Log correlation, IOC identification, and anomaly investigation' },
      { name: 'Incident Response Protocol', description: 'Calm triage, containment strategies, and evidence preservation' },
      { name: 'Application & Cloud Security', description: 'Remediating OWASP Top 10 and securing cloud infrastructure' },
      { name: 'Security Governance & Risk', description: 'Compliance alignment, security awareness, and vendor risk management' }
    ],
    sampleScenarios: [
      'Your SIEM flags an alert showing an employee account logged in from London and Mumbai within 10 minutes, followed by 5GB of data downloaded. What do you do?',
      'A zero-day remote code execution vulnerability is disclosed in a widely used open-source library in your production app. Walk through your emergency protocol.'
    ]
  },
  {
    id: 'ui-ux-designer',
    label: 'UI/UX Designer',
    category: 'Tech',
    competencies: [
      'User research methodologies (interviews, usability testing, personas)',
      'Design systems creation, tokens, and component libraries in Figma',
      'Wireframing, high-fidelity prototyping, and interactive micro-interactions',
      'Information architecture, user journey mapping, and wireflows',
      'Accessibility standards (WCAG 2.1 AA/AAA compliance, contrast, touch targets)',
      'Design-to-engineering handoff and cross-functional alignment'
    ],
    topicAreas: [
      'Redesigning complex workflows to reduce cognitive load and drop-offs',
      'Conducting usability testing with 5 users to uncover critical blockers',
      'Maintaining scalability and version control in a company-wide design system',
      'Balancing user desires with business goals and monetization constraints',
      'Collaborating with frontend engineers on responsive implementation limitations'
    ],
    interviewStyle: 'Portfolio scenario deep-dive, design rationale defense, empathy-first problem discovery, and design system governance.',
    scoringDimensions: [
      { name: 'UX Research & User Centricity', description: 'Validating assumptions with research, empathy, and user feedback' },
      { name: 'UI Craft & Design Systems', description: 'Visual hierarchy, typography, micro-interactions, and component modularity' },
      { name: 'Accessibility & Usability', description: 'Inclusive design, WCAG compliance, and frictionless user flows' },
      { name: 'Product Sense & Engineering Handoff', description: 'Collaborating effectively with developers and defending design decisions' }
    ],
    sampleScenarios: [
      'Analytics show that 60% of users abandon onboarding at step 3 (linking a bank account). How do you research the issue and redesign the experience?',
      'An engineering lead tells you that your proposed animations and layout are too complex to build within the sprint. How do you negotiate trade-offs?'
    ]
  },
  {
    id: 'product-manager',
    label: 'Product Manager',
    category: 'Tech',
    competencies: [
      'Product strategy, roadmap definition, and OKRs',
      'Customer discovery, user empathy, and feedback synthesis',
      'Prioritization frameworks (RICE, MoSCoW, Kano, Cost of Delay)',
      'Product analytics & north star metrics (Retention, Activation, LTV)',
      'Go-to-Market (GTM) execution and cross-functional leadership',
      'Technical fluency and working closely with engineering teams'
    ],
    topicAreas: [
      'Defining a product vision for a 0-to-1 feature vs optimizing an existing funnel',
      'Prioritizing competing requests from sales, executives, and engineering tech debt',
      'Diagnosing a critical metric decline (e.g. 30-day retention drops by 20%)',
      'Writing crisp PRDs with clear user stories, edge cases, and success metrics',
      'Running effective sprint planning, retrospectives, and post-launch reviews'
    ],
    interviewStyle: 'Structured product sense drills, prioritization dilemmas, metric debugging, and executive stakeholder alignment.',
    scoringDimensions: [
      { name: 'Product Sense & User Empathy', description: 'Identifying core user problems and designing elegant solutions' },
      { name: 'Prioritization & Strategic Focus', description: 'Ruthless prioritization framework usage and defending trade-offs' },
      { name: 'Analytical & Metric Rigor', description: 'Defining actionable KPIs, north star metrics, and diagnosing funnel data' },
      { name: 'Stakeholder & Team Leadership', description: 'Influence without authority, cross-functional collaboration, and communication' }
    ],
    sampleScenarios: [
      'Your enterprise sales team demands a custom feature to close a $1M deal, but building it will delay your consumer roadmap by 3 months. How do you resolve this?',
      'Imagine you are the PM for WhatsApp Status. What is your north star metric, and how would you improve monetization without harming user engagement?'
    ]
  },
  {
    id: 'business-analyst',
    label: 'Business Analyst',
    category: 'Tech',
    competencies: [
      'Requirements elicitation & stakeholder interview techniques',
      'Business process mapping (BPMN, flowcharts, swimlanes)',
      'Functional Requirement Documents (FRD) & User Stories with Acceptance Criteria',
      'Gap analysis, feasibility studies, and cost-benefit calculations',
      'Data analysis using SQL, Excel (vlookup, pivot tables), and BI tools',
      'User Acceptance Testing (UAT) coordination and change management'
    ],
    topicAreas: [
      'Translating ambiguous executive business requests into crisp technical requirements',
      'Mapping AS-IS business processes to TO-BE automated workflows',
      'Handling scope creep during active sprint implementation',
      'Managing conflicting requirements between operations and finance teams',
      'Leading successful UAT sign-offs with non-technical business users'
    ],
    interviewStyle: 'Requirements gathering simulations, process mapping walkthroughs, scope negotiation, and clear documentation review.',
    scoringDimensions: [
      { name: 'Requirements Engineering', description: 'Clarity of user stories, acceptance criteria, and edge-case capturing' },
      { name: 'Process Modeling & Gap Analysis', description: 'Visualizing workflows, spotting inefficiencies, and designing improvements' },
      { name: 'Stakeholder Mediation', description: 'Resolving conflicting priorities between business and technical groups' },
      { name: 'Data & Commercial Understanding', description: 'Quantifying ROI, business case formulation, and basic data verification' }
    ],
    sampleScenarios: [
      'Operations wants an instant approval button for vendor payments, while Compliance demands a 3-step manual check. How do you design the requirements?',
      'Halfway through a project, the client marketing VP asks for three major scope changes. How do you document, assess, and communicate the impact?'
    ]
  },
  {
    id: 'project-manager-scrum-master',
    label: 'Project Manager / Scrum Master',
    category: 'Tech',
    competencies: [
      'Agile / Scrum ceremonies (Sprint Planning, Daily Standup, Review, Retrospective)',
      'Risk management, dependency mapping, and critical path analysis',
      'Sprint metrics (Velocity, Burndown, Cycle Time, Lead Time)',
      'Managing project budgets, milestones, and scope creep',
      'Conflict resolution, psychological safety, and team coaching',
      'Project management tools (Jira, Confluence, Linear, Asana)'
    ],
    topicAreas: [
      'Handling a team that consistently misses sprint commitments',
      'Resolving persistent friction between lead engineers and product owners',
      'Protecting the engineering team from ad-hoc executive distractions',
      'Managing multi-team cross-dependencies in a large software release',
      'Running blameless retrospectives that produce concrete process improvements'
    ],
    interviewStyle: 'Team dynamics problem-solving, delivery crisis resolution, Agile framework pragmatism, and executive updates.',
    scoringDimensions: [
      { name: 'Agile Mindset & Framework Knowledge', description: 'Applying Scrum/Kanban effectively rather than dogmatically' },
      { name: 'Delivery & Risk Management', description: 'Unblocking teams, tracking dependencies, and hitting target dates' },
      { name: 'Team Coaching & Conflict Resolution', description: 'Navigating personality clashes, burnout, and accountability' },
      { name: 'Communication & Stakeholder Reporting', description: 'Executive status reports, clear escalation paths, and transparency' }
    ],
    sampleScenarios: [
      'Two key senior developers on your team disagree vehemently on an architectural path and are delaying the entire sprint. How do you facilitate a resolution?',
      'Your project is 3 weeks behind schedule with a fixed hard launch deadline promised to customers. What options do you evaluate and present to leadership?'
    ]
  },

  // ==========================================
  // HR ROLES (5)
  // ==========================================
  {
    id: 'talent-acquisition-recruiter',
    label: 'Talent Acquisition / Recruiter',
    category: 'HR',
    competencies: [
      'Sourcing strategies (LinkedIn Recruiter, boolean search, GitHub, referrals, headhunting)',
      'Job description intake and expectation calibration with hiring managers',
      'Candidate screening, behavioural qualification, and pipeline management in ATS',
      'Managing candidate ghosting, engagement drop-offs, and offer decline risks',
      'Offer negotiation, compensation benchmarks, and closing strategies',
      'Recruitment metrics (Time-to-Hire, Cost-per-Hire, Offer Acceptance Rate, Source of Hire)',
      'Diversity, Equity & Inclusion (DEI) hiring strategies',
      'Volume/bulk hiring management and campus/early career drives',
      'Stakeholder management and managing unrealistic hiring manager demands'
    ],
    topicAreas: [
      'Proactive outbound sourcing for niche, hard-to-fill tech or leadership roles',
      'Conducting structured intake meetings to challenge unrealistic JD wishlists',
      'Re-engaging candidates who stop responding after initial rounds',
      'Closing candidates with competing offers without blowing internal salary bands',
      'Tracking and presenting hiring funnel conversion rates to executive leadership',
      'Handling hiring manager pushback who rejects all shortlisted candidates'
    ],
    interviewStyle: 'Scenario role-play (e.g. negotiating an offer, handling a demanding hiring manager), recruiting metric analysis, and candidate experience strategy.',
    scoringDimensions: [
      { name: 'Sourcing & Pipeline Strategy', description: 'Creative search, boolean queries, multi-channel outreach, and talent mapping' },
      { name: 'Candidate Engagement & Closing', description: 'Pre-closing, understanding candidate motivations, and salary negotiation' },
      { name: 'Stakeholder Calibration & Influence', description: 'Pushing back respectfully on managers, setting realistic timelines' },
      { name: 'Recruitment Metrics & ATS Mastery', description: 'Data-driven pipeline management (time-to-hire, funnel conversion, offer drop-off)' }
    ],
    sampleScenarios: [
      'A hiring manager insists they need a 10-year experienced AI engineer for a junior salary band and rejects all 15 profiles you submitted. How do you handle this intake calibration?',
      'Your top candidate for a critical role just received a competing offer that is 20% higher than your approved maximum band. How do you negotiate and pitch to close them?',
      'You are noticing a 40% offer drop-off rate across tech roles over the last quarter. What data points do you analyze and what solutions do you implement?'
    ]
  },
  {
    id: 'hr-executive-generalist',
    label: 'HR Executive / Generalist',
    category: 'HR',
    competencies: [
      'End-to-end employee lifecycle management (Onboarding to Offboarding)',
      'Employee relations, workplace grievance handling, and conflict resolution',
      'Performance appraisal cycles and pip (Performance Improvement Plan) facilitation',
      'Attendance, leave management, and employee records in HRMS',
      'Statutory compliance & labour law basics (India: PF, ESI, Gratuity, Bonus, POSH)',
      'Employee engagement initiatives, culture building, and pulse surveys',
      'Exit interviews, attrition analysis, and retention strategies'
    ],
    topicAreas: [
      'Facilitating an impartial investigation into an employee misconduct complaint',
      'Designing an engaging, structured 30-60-90 day onboarding program',
      'Managing difficult offboarding, involuntary terminations, and severance conversations',
      'Ensuring statutory compliance records and audit readiness for local labour laws',
      'Addressing low morale or high team-level attrition in specific departments'
    ],
    interviewStyle: 'Empathetic yet legally compliant problem solving, employee mediation scenarios, policy formulation, and workplace culture leadership.',
    scoringDimensions: [
      { name: 'Employee Relations & Conflict Resolution', description: 'Impartiality, empathy, documentation rigor, and mediation fairness' },
      { name: 'Labour Law & Statutory Awareness', description: 'Working knowledge of PF, ESI, Gratuity, POSH, and basic workplace regulations' },
      { name: 'Employee Lifecycle Operations', description: 'Smooth onboarding, appraisal facilitation, and professional exit processes' },
      { name: 'Culture & Retention Strategy', description: 'Proactive engagement, identifying retention risks, and morale building' }
    ],
    sampleScenarios: [
      'An employee comes to you confidentially stating that their manager is unfairly targeting them and making biased remarks. How do you handle this investigation?',
      'A valued top-performing employee suddenly submits their resignation citing team burnout and lack of recognition. What is your retention action plan?'
    ]
  },
  {
    id: 'hr-business-partner',
    label: 'HR Business Partner',
    category: 'HR',
    competencies: [
      'Strategic workforce planning and org design',
      'Business acumen and aligning HR initiatives with commercial goals',
      'Leadership coaching and executive stakeholder management',
      'Succession planning, high-potential talent identification (9-box grid)',
      'Change management during restructuring, mergers, or rapid scaling',
      'Advanced HR analytics (predictive turnover, revenue per employee, span of control)',
      'Complex employee relations, ethics investigations, and executive mediation'
    ],
    topicAreas: [
      'Partnering with business unit leaders to design an org chart for next fiscal year',
      'Facilitating talent review calibration sessions across department leads',
      'Managing sensitive team restructuring and role eliminations with compassion and legal care',
      'Diagnosing root causes of high manager-level turnover in high-stress divisions',
      'Creating leadership development tracks for mid-level managers'
    ],
    interviewStyle: 'Executive consulting style, strategic HR trade-offs, commercial metric alignment, and leadership influence simulations.',
    scoringDimensions: [
      { name: 'Strategic Business Alignment', description: 'Connecting HR strategy to revenue, margins, and departmental deliverables' },
      { name: 'Workforce Planning & Org Design', description: 'Span of control, succession pipelines, and headcount budgeting' },
      { name: 'Executive Influence & Coaching', description: 'Challenging senior leaders constructively and driving organizational change' },
      { name: 'Talent Calibration & Retention', description: 'Fair performance reviews, high-performer growth, and retention modeling' }
    ],
    sampleScenarios: [
      'A business head announces they want to replace their entire 12-person customer support team with an outsourced agency within 30 days. How do you advise them?',
      'During a talent calibration meeting, two division heads fiercely debate who deserves the highest rating band in a forced-distribution model. How do you guide the calibration?'
    ]
  },
  {
    id: 'payroll-compliance-executive',
    label: 'Payroll & Compliance Executive',
    category: 'HR',
    competencies: [
      'End-to-end monthly payroll processing, salary structures, and CTC breakups',
      'Statutory deductions (India: Provident Fund, ESI, Professional Tax, TDS under old/new regimes)',
      'Full & Final (F&F) settlement calculations, leave encashment, and gratuity rules',
      'Payroll error reconciliation, clawbacks, and arrears adjustments',
      'Statutory compliance calendars, filing deadlines (PF ECR, ESI returns, Form 16/24Q)',
      'Labor compliance audits, registers maintenance, and factory/shop establishment acts',
      'Payroll software and HRMS integration (Keka, Darwinbox, GreytHR, SAP)'
    ],
    topicAreas: [
      'Designing tax-optimized, legally compliant salary structures (Basic, HRA, Special Allowance)',
      'Handling an urgent payroll discrepancy where 50 employees received incorrect salaries',
      'Calculating complex F&F settlements involving unserved notice pay recovery and gratuity',
      'Navigating statutory labor audits and maintaining required compliance documentation',
      'Explaining complex tax deductions and investment declaration proofs to confused employees'
    ],
    interviewStyle: 'Numerical precision checks, compliance scenario drills, tax rule interpretation, and handling high-stress payroll crisis situations.',
    scoringDimensions: [
      { name: 'Payroll Calculations & CTC Structuring', description: 'Mathematical precision, allowances, reimbursements, and deduction rules' },
      { name: 'Statutory Compliance Mastery', description: 'In-depth knowledge of PF, ESI, Gratuity, Bonus, PT, and TDS filing regulations' },
      { name: 'Audit Readiness & Governance', description: 'Statutory registers, timely filings, and mitigating legal non-compliance risks' },
      { name: 'Crisis Resolution & Employee Support', description: 'Fast error correction, transparent communication, and empathy during pay disputes' }
    ],
    sampleScenarios: [
      'It is salary day and the bank transfer file failed for 120 employees due to an IFSC format error. What immediate steps and communications do you take?',
      'An employee who resigned after 4 years and 240 days claims they are legally eligible for gratuity payment. How do you calculate and explain their settlement?'
    ]
  },
  {
    id: 'learning-development',
    label: 'Learning & Development',
    category: 'HR',
    competencies: [
      'Training Needs Analysis (TNA) and competency gap assessment',
      'Instructional design models (ADDIE, Kirkpatrick evaluation model)',
      'Designing leadership development programs and onboarding academies',
      'LMS (Learning Management System) administration and content curation',
      'Facilitation, workshop delivery, and trainer evaluation',
      'Measuring Training ROI, completion rates, and post-training behavioral changes'
    ],
    topicAreas: [
      'Conducting a thorough TNA across technical and soft-skill departments',
      'Evaluating whether a training program delivered measurable business ROI',
      'Overcoming employee cynicism and low attendance for mandatory corporate training',
      'Building internal mentorship programs and peer learning circles',
      'Selecting and managing external executive training vendors'
    ],
    interviewStyle: 'Pedagogical design defense, stakeholder engagement, training ROI justification, and interactive facilitation simulations.',
    scoringDimensions: [
      { name: 'Training Needs Analysis', description: 'Accurately uncovering skill deficits through interviews, surveys, and data' },
      { name: 'Program & Curriculum Design', description: 'Applying sound instructional frameworks (ADDIE, experiential learning)' },
      { name: 'Engagement & Facilitation', description: 'Delivering compelling workshops and driving learner participation' },
      { name: 'ROI & Impact Measurement', description: 'Evaluating behavioral change and business metrics using Kirkpatrick model' }
    ],
    sampleScenarios: [
      'The VP of Sales demands a 2-hour negotiation workshop because quarterly numbers dipped, but you suspect the issue is product-market fit. How do you approach this?',
      'How do you measure whether a $50,000 leadership development program for 30 managers actually impacted team retention and productivity 6 months later?'
    ]
  },

  // ==========================================
  // NON-TECH ROLES (12)
  // ==========================================
  {
    id: 'digital-marketing',
    label: 'Digital Marketing',
    category: 'Non-Tech',
    competencies: [
      'Paid Acquisition (Google Ads, Meta Ads, LinkedIn Ads, programmatic)',
      'Performance metrics (CAC, CPA, ROAS, CTR, CPC, Conversion Rate)',
      'SEO (keyword strategy, on-page, technical SEO, link building)',
      'Growth funnels, landing page conversion rate optimization (CRO), A/B testing',
      'Email marketing, lifecycle automation, and drip campaigns',
      'Analytics tools (GA4, Google Tag Manager, Mixpanel, Search Console)',
      'Budget allocation and marketing spend forecasting'
    ],
    topicAreas: [
      'Diagnosing a sudden 40% drop in Meta Ads ROAS after a platform algorithm change',
      'Scaling paid spend from $5,000/mo to $50,000/mo without inflating customer acquisition cost',
      'Designing high-converting A/B tests for landing page headlines and CTAs',
      'Technical SEO audits: indexing issues, Core Web Vitals, and cannibalization',
      'Multi-touch attribution models: first-click, last-click, and data-driven attribution'
    ],
    interviewStyle: 'Campaign scenario diagnosis, quantitative marketing math, funnel optimization drills, and budget allocation decisions.',
    scoringDimensions: [
      { name: 'Performance Marketing & ROAS', description: 'Optimizing paid channels, CAC management, and bid strategies' },
      { name: 'Analytical Acumen & Data Tracking', description: 'GA4, attribution, funnel leakage diagnosis, and conversion analysis' },
      { name: 'Organic Growth & SEO', description: 'Search strategy, content alignment, and domain authority growth' },
      { name: 'Experimentation & CRO', description: 'Systematic A/B testing methodology and landing page optimization' }
    ],
    sampleScenarios: [
      'Your Google Search campaigns are generating high click volume with an 8% CTR, but your landing page conversion rate is under 0.8%. What is your audit process?',
      'If you had a $30,000 quarterly budget for a B2B SaaS product with an average contract value of $5,000, how would you distribute it across channels?'
    ]
  },
  {
    id: 'content-writer-copywriter',
    label: 'Content Writer / Copywriter',
    category: 'Non-Tech',
    competencies: [
      'Persuasive copywriting (direct response, sales pages, ad creatives, email hooks)',
      'Long-form content creation (thought leadership, whitepapers, case studies, blogs)',
      'Brand tone of voice and narrative storytelling',
      'SEO content strategy and keyword integration',
      'Headline crafting and click-through optimization',
      'Editing, proofreading, and research synthesis',
      'Leveraging AI writing tools responsibly while preserving human depth and authenticity'
    ],
    topicAreas: [
      'Writing compelling copy for a complex B2B product that non-experts can understand',
      'Revamping an underperforming email newsletter to double open and click rates',
      'Crafting authentic founder thought leadership on LinkedIn that drives inbound leads',
      'Researching and structuring a 3,000-word comprehensive pillar guide',
      'Handling feedback from stakeholders who want to insert heavy corporate jargon'
    ],
    interviewStyle: 'Creative copy critique, headline generation tests, brand tone alignment, and storytelling walk-throughs.',
    scoringDimensions: [
      { name: 'Copywriting & Hook Mastery', description: 'Persuasive messaging, strong value propositions, and captivating hooks' },
      { name: 'Research & Long-Form Depth', description: 'Substantive insights, logical flow, and credible authority building' },
      { name: 'Tone Versatility & Brand Alignment', description: 'Adapting voice to B2B, consumer, playful, or executive personas' },
      { name: 'SEO & Audience Engagement', description: 'Integrating keywords naturally while writing primarily for human readers' }
    ],
    sampleScenarios: [
      'Draft two contrasting ad headlines for a time-tracking software: one fear-based (loss aversion) and one benefit-driven.',
      'A stakeholder insists on turning your clear, punchy website headline into a 4-sentence buzzword-filled corporate paragraph. How do you respond?'
    ]
  },
  {
    id: 'sales-business-development',
    label: 'Sales / Business Development',
    category: 'Non-Tech',
    competencies: [
      'Prospecting, cold outreach (email, phone, LinkedIn), and lead qualification (BANT, MEDDIC)',
      'Discovery call execution and uncovering underlying business pain points',
      'Product demonstration tailored to executive priorities',
      'Handling tough customer objections (price, timing, competitors, internal build)',
      'Sales pipeline management, CRM hygiene (Salesforce, HubSpot), and forecasting',
      'Negotiation, deal structuring, and closing techniques',
      'Account management and expansion / upselling strategies'
    ],
    topicAreas: [
      'Uncovering whether a prospect truly has budget and decision-making power',
      'Overcoming the objection: "Your price is 40% higher than your competitor"',
      'Handling the objection: "We are happy with our current vendor and have no plans to switch"',
      'Managing a stalled deal that went completely silent after a great demo',
      'Balancing monthly sales quotas with building long-term customer trust'
    ],
    interviewStyle: 'Interactive role-play (the AI acts as a skeptical, price-sensitive enterprise prospect), objection handling drills, and pipeline strategy.',
    scoringDimensions: [
      { name: 'Discovery & Pain Point Identification', description: 'Asking deep probing questions rather than feature dumping' },
      { name: 'Objection Handling & Composure', description: 'Reframing objections logically and calmly without getting defensive' },
      { name: 'Closing & Deal Momentum', description: 'Creating urgency, securing clear next steps, and effective negotiation' },
      { name: 'Pipeline & Account Strategy', description: 'Prioritizing high-probability opportunities and maintaining deal velocity' }
    ],
    sampleScenarios: [
      'ROLE-PLAY: I am the CFO of a mid-sized company. You just finished your pitch, and I tell you: "This looks nice to have, but in this economy we are freezing all new software spend. Talk to us next year." How do you respond right now?',
      'A prospect loved your demo, agreed on terms, but has stopped responding to your emails and calls for two weeks right before the quarter closes. What is your playbook?'
    ]
  },
  {
    id: 'customer-support',
    label: 'Customer Support',
    category: 'Non-Tech',
    competencies: [
      'Customer empathy, de-escalation of furious or frustrated users, and active listening',
      'Ticketing tools (Zendesk, Freshdesk, Intercom, Jira Service Desk)',
      'Core support metrics (First Response Time - FRT, Average Handle Time - AHT, CSAT, CES)',
      'Technical troubleshooting and reproducing user issues step-by-step',
      'Clear, jargon-free written and verbal communication',
      'Escalation protocols to tier-2, engineering, and product teams',
      'Creating knowledge base articles and canned responses that feel human'
    ],
    topicAreas: [
      'Handling an irate customer whose payment was deducted twice and account got suspended',
      'Managing high ticket spikes during an unexpected cloud platform outage',
      'Politely saying "no" to an unreasonable or out-of-scope customer demand',
      'Explaining a complex technical glitch to an elderly or non-tech-savvy customer',
      'Balancing fast handle times (AHT) with genuine customer satisfaction (CSAT)'
    ],
    interviewStyle: 'Live de-escalation role-play (the AI acts as an angry user facing a broken feature), support metrics awareness, and troubleshooting patience.',
    scoringDimensions: [
      { name: 'Empathy & De-escalation', description: 'Diffusing anger, validating feelings, and remaining calm under fire' },
      { name: 'Problem Solving & Troubleshooting', description: 'Diagnosing the root issue methodically and offering clear steps' },
      { name: 'Clarity of Communication', description: 'Simple, positive phrasing without defensive or confusing jargon' },
      { name: 'Process & Metric Awareness', description: 'Balancing CSAT, First Response Time, and escalation documentation' }
    ],
    sampleScenarios: [
      'ROLE-PLAY: I am a paying business customer, and I am shouting: "Your app crashed in the middle of our client presentation, and we looked like clowns! I want an instant full refund and to speak to your CEO right now!" Handle this customer.',
      'A user is unable to log in, but they insist their password is correct and refuse to reset it. How do you troubleshoot patiently?'
    ]
  },
  {
    id: 'operations-executive',
    label: 'Operations Executive',
    category: 'Non-Tech',
    competencies: [
      'Business process optimization and standard operating procedures (SOPs)',
      'Cross-functional operational coordination and bottleneck resolution',
      'KPI tracking, SLA monitoring, and operational dashboards',
      'Vendor management, contract compliance, and facility management',
      'Resource planning, capacity modeling, and inventory checks',
      'Risk mitigation, crisis response, and business continuity'
    ],
    topicAreas: [
      'Identifying operational bottlenecks in daily fulfillment or service delivery',
      'Managing a third-party vendor that is consistently failing their agreed SLAs',
      'Implementing a new ERP or workflow tool across reluctant frontline employees',
      'Cost reduction initiatives that do not compromise delivery quality',
      'Handling sudden operational disruptions (weather, vendor strike, software failure)'
    ],
    interviewStyle: 'Operational crisis management, process re-engineering scenarios, data-backed decision making, and SLA enforcement.',
    scoringDimensions: [
      { name: 'Process Optimization & SOP Design', description: 'Eliminating friction, reducing waste, and standardizing repeatable workflows' },
      { name: 'Crisis Resolution & SLA Defense', description: 'Calm execution during bottlenecks and safeguarding operational targets' },
      { name: 'Vendor & Resource Management', description: 'Holding external partners accountable and optimizing resource allocation' },
      { name: 'Data-Driven Operational Acumen', description: 'Using throughput, turnaround time, and cost metrics to steer decisions' }
    ],
    sampleScenarios: [
      'A key logistics partner suddenly announces their drivers are on strike, leaving 3,000 orders pending for same-day delivery. What is your contingency plan?',
      'Your department’s turnaround time has deteriorated by 25% over the past month. How do you audit the workflow and pinpoint the bottleneck?'
    ]
  },
  {
    id: 'supply-chain-logistics',
    label: 'Supply Chain / Logistics',
    category: 'Non-Tech',
    competencies: [
      'Inventory management (Safety stock, Reorder point, EOQ, JIT, ABC analysis)',
      'Freight forwarding, 3PL/4PL vendor management, and cold chain logistics',
      'Warehouse management systems (WMS) and fulfillment operations',
      'Procurement, purchase orders, and supplier scorecards',
      'Supply chain risk management and demand forecasting integration',
      'Import/Export customs regulations and documentation (Bill of Lading, Incoterms)'
    ],
    topicAreas: [
      'Optimizing safety stock levels to prevent stockouts during peak seasons',
      'Managing port congestions, shipping delays, and carrier rate negotiations',
      'Reducing warehouse shrinkage, return processing times, and pick-pack errors',
      'Applying Incoterms correctly (FOB, CIF, DDP) in international supplier contracts',
      'Vendor quality audits and managing single-supplier dependency risks'
    ],
    interviewStyle: 'Supply chain disruption drills, inventory math problems, vendor negotiation scenarios, and logistics network design.',
    scoringDimensions: [
      { name: 'Inventory & Demand Planning', description: 'Stock calculation accuracy, turnover optimization, and carrying cost reduction' },
      { name: 'Logistics Execution & Carrier Management', description: 'Transit time optimization, 3PL oversight, and route planning' },
      { name: 'Risk Management & Disruption Response', description: 'Diversifying suppliers and handling unexpected delivery delays' },
      { name: 'Regulatory & Trade Compliance', description: 'Familiarity with Incoterms, customs clearances, and warehouse compliance' }
    ],
    sampleScenarios: [
      'A critical shipment of raw materials from overseas is delayed at customs for 10 days, threatening a complete plant shutdown. How do you manage this crisis?',
      'Explain the trade-offs between Just-In-Time (JIT) inventory and maintaining safety stock in today’s volatile shipping climate.'
    ]
  },
  {
    id: 'accountant-finance-executive',
    label: 'Accountant / Finance Executive',
    category: 'Non-Tech',
    competencies: [
      'General Ledger (GL) accounting, journal entries, and balance sheet reconciliation',
      'Accounts Payable (AP) and Accounts Receivable (AR) management',
      'Tax compliance (India: GST returns, TDS calculation and deposit, advance tax)',
      'Month-end and year-end financial close processes',
      'Bank reconciliation statements (BRS) and cash flow tracking',
      'Advanced Excel (Pivot tables, VLOOKUP, INDEX-MATCH, XLOOKUP)',
      'Accounting software (Tally Prime, QuickBooks, Zoho Books, SAP FICO)'
    ],
    topicAreas: [
      'Detecting and rectifying imbalances in bank reconciliations or trial balances',
      'Ensuring correct GST input tax credit (ITC) reconciliation with GSTR-2B',
      'Managing the entire month-end financial closing checklist under tight deadlines',
      'Handling an aggressive vendor threatening to stop supplies over an unpaid disputed invoice',
      'Preparing documentation for statutory financial audits and tax audits'
    ],
    interviewStyle: 'Accounting entry accuracy, statutory taxation knowledge checks, reconciliation problem solving, and audit compliance.',
    scoringDimensions: [
      { name: 'Accounting Principles & Precision', description: 'Double-entry mechanics, accruals, depreciation, and GL reconciliation' },
      { name: 'Tax Compliance & Statutory Rules', description: 'GST filing, TDS deduction categories, and tax calendar adherence' },
      { name: 'Financial Close & Reporting', description: 'Timely month-end closing, trial balance verification, and financial statements' },
      { name: 'Excel & Software Proficiency', description: 'Advanced spreadsheet modeling, ERP navigation, and error prevention' }
    ],
    sampleScenarios: [
      'A bank reconciliation statement shows a ₹4,50,000 discrepancy between the book balance and the bank statement at month-end. How do you track it down?',
      'A vendor invoice has been submitted without a corresponding Purchase Order (PO) or goods receipt note (GRN). The department head insists on paying it immediately. What do you do?'
    ]
  },
  {
    id: 'financial-analyst',
    label: 'Financial Analyst',
    category: 'Non-Tech',
    competencies: [
      'Financial modeling (3-statement models, DCF, sensitivity analysis)',
      'Budgeting, forecasting, and variance analysis (Actual vs Budget)',
      'Financial statement analysis (P&L, Balance Sheet, Cash Flow ratios)',
      'Capital budgeting, NPV, IRR, and payback period calculations',
      'Cost-benefit analysis and business unit performance benchmarking',
      'Executive presentation of financial models (PowerPoint, BI dashboards)'
    ],
    topicAreas: [
      'Building a rolling 12-month financial forecast for a growing business',
      'Explaining why EBITDA increased while operational cash flow decreased sharply',
      'Evaluating whether to lease or buy equipment using discounted cash flow analysis',
      'Conducting variance analysis on a department that is 30% over budget',
      'Stress-testing financial models against interest rate spikes and inflation'
    ],
    interviewStyle: 'Financial case analysis, valuation and ratio interrogation, modeling methodology defense, and commercial forecasting.',
    scoringDimensions: [
      { name: 'Financial Modeling & Projections', description: 'Integrity of 3-statement models, assumptions, and scenario sensitivity' },
      { name: 'Variance & Ratio Analysis', description: 'Deconstructing financial statements, margin trends, and liquidity' },
      { name: 'Commercial Acumen & Valuation', description: 'NPV, DCF, IRR, and evaluating capital allocation decisions' },
      { name: 'Executive Financial Storytelling', description: 'Translating complex financial models into strategic business recommendations' }
    ],
    sampleScenarios: [
      'A company reports record-high net profit on its P&L, but its bank account is almost out of cash and it cannot pay suppliers. Explain how this happens.',
      'Your company is evaluating whether to acquire a smaller competitor for $10M. What key valuation multiples and financial checks do you run?'
    ]
  },
  {
    id: 'banking-relationship-manager',
    label: 'Banking / Relationship Manager',
    category: 'Non-Tech',
    competencies: [
      'Client relationship building (HNI, retail, or SME business clients)',
      'Banking products (CASA accounts, fixed deposits, commercial loans, trade finance)',
      'Credit assessment basics (CIBIL/credit scores, debt service coverage ratio, collateral)',
      'Cross-selling wealth management products, insurance, and mutual funds',
      'KYC (Know Your Customer) and Anti-Money Laundering (AML) regulations',
      'Portfolio management, client retention, and achieving quarterly revenue targets'
    ],
    topicAreas: [
      'Persuading a high-net-worth individual (HNI) to transfer their primary banking portfolio',
      'Assessing the loan creditworthiness of an SME business with volatile revenues',
      'Handling a customer upset over unexpected bank charges or high loan interest rates',
      'Ensuring strict KYC/AML compliance without frustrating high-value clients',
      'Managing tough quarterly cross-selling targets ethically'
    ],
    interviewStyle: 'Relationship management role-play, consultative selling drills, financial product knowledge, and regulatory compliance awareness.',
    scoringDimensions: [
      { name: 'Client Relationship & Trust Building', description: 'Consultative rapport, customer retention, and emotional intelligence' },
      { name: 'Credit & Product Knowledge', description: 'Understanding lending, trade finance, investment products, and risk' },
      { name: 'Cross-Selling & Target Execution', description: 'Identifying customer needs and recommending suitable banking solutions' },
      { name: 'KYC & Regulatory Compliance', description: 'Adhering to anti-money laundering, documentation, and ethical standards' }
    ],
    sampleScenarios: [
      'An SME client who has banked with you for 5 years applies for a ₹50 lakh working capital loan, but their recent balance sheet shows declining profits. How do you handle this?',
      'An HNI customer threatens to close all their accounts because a ₹1,500 penalty charge was levied on their account. How do you resolve this and retain the relationship?'
    ]
  },
  {
    id: 'teacher-trainer',
    label: 'Teacher / Trainer',
    category: 'Non-Tech',
    competencies: [
      'Lesson planning, curriculum design, and pedagogical strategies',
      'Classroom management, student engagement, and active learning techniques',
      'Differentiated instruction for varying student skill and learning levels',
      'Assessment design (formative, summative) and constructive feedback delivery',
      'Educational technology integration (LMS, interactive presentation tools)',
      'Parent-teacher communication and student counseling'
    ],
    topicAreas: [
      'Managing a disruptive or disengaged classroom without resorting to shouting',
      'Explaining a difficult abstract concept using tangible, real-world analogies',
      'Supporting a student who is failing despite showing effort in class',
      'Conducting an effective parent-teacher meeting regarding a student’s behavioral issue',
      'Adapting lesson plans on the fly when students clearly have not understood the concept'
    ],
    interviewStyle: 'Micro-teaching simulation, classroom dilemma management, pedagogical philosophy defense, and empathy checks.',
    scoringDimensions: [
      { name: 'Pedagogical Clarity & Communication', description: 'Breaking down complex ideas with simplicity, clarity, and enthusiasm' },
      { name: 'Classroom & Engagement Management', description: 'Fostering respect, participation, and maintaining student attention' },
      { name: 'Differentiated Learning & Empathy', description: 'Adapting to students with different learning speeds and backgrounds' },
      { name: 'Assessment & Constructive Feedback', description: 'Designing fair evaluations and giving feedback that inspires growth' }
    ],
    sampleScenarios: [
      'You are teaching a classroom where 5 students grasp the lesson in 5 minutes and get bored, while 10 students are completely lost. How do you balance the class?',
      'A parent angrily confronts you claiming you gave their child an unfair low grade because you dislike them. How do you conduct this meeting?'
    ]
  },
  {
    id: 'administration-executive-assistant',
    label: 'Administration / Executive Assistant',
    category: 'Non-Tech',
    competencies: [
      'Executive calendar management, complex scheduling, and time zone coordination',
      'Confidentiality, discretion, and executive gatekeeping',
      'Domestic & international travel coordination, itineraries, and expense reporting',
      'Office administration, facility operations, and vendor management',
      'Meeting preparation (Agendas, board decks, executive minutes of meeting - MOM)',
      'Crisis handling, rapid task prioritization, and executive communication'
    ],
    topicAreas: [
      'Resolving a critical scheduling conflict involving multiple C-level executives',
      'Handling confidential executive information (layoffs, acquisitions) with strict discretion',
      'Re-booking flights and hotels when an executive gets stranded due to a canceled connection',
      'Managing demanding office vendors and reducing administrative operating expenses',
      'Drafting executive correspondence on behalf of the CEO with flawless polish'
    ],
    interviewStyle: 'High-pressure scheduling simulations, confidentiality dilemmas, prioritization triage, and executive polish.',
    scoringDimensions: [
      { name: 'Calendar & Travel Coordination', description: 'Flawless logistics, anticipation of delays, and multi-timezone scheduling' },
      { name: 'Discretion & Confidentiality', description: 'Guarding sensitive company information and diplomatic communication' },
      { name: 'Prioritization & Composure Under Pressure', description: 'Triage when multiple urgent requests arrive simultaneously' },
      { name: 'Executive Polish & Organization', description: 'Clear documentation, professional correspondence, and attention to detail' }
    ],
    sampleScenarios: [
      'The CEO’s international flight is canceled 3 hours before a critical investor meeting in Frankfurt. How do you resolve this logistics emergency?',
      'A senior board member calls asking for details about an upcoming confidential acquisition that you manage documents for. How do you handle the request diplomatically?'
    ]
  },
  {
    id: 'consulting-case-based',
    label: 'Consulting (case-based)',
    category: 'Non-Tech',
    competencies: [
      'Structured problem solving and MECE (Mutually Exclusive, Collectively Exhaustive) frameworks',
      'Market sizing and mental math estimations (Fermi problems)',
      'Profitability framework (Revenue = Price * Volume, Cost = Fixed + Variable)',
      'Market entry and M&A evaluation frameworks',
      'Synthesizing insights and executive-level recommendations (Pyramid Principle)',
      'Handling ambiguity, making logical assumptions, and stress-testing hypotheses'
    ],
    topicAreas: [
      'Diagnosing why a national airline’s profits fell 25% despite passenger numbers rising',
      'Estimating the annual market size for electric vehicle charging stations in India',
      'Advising a consumer goods company whether to enter the plant-based meat sector',
      'Restructuring a legacy manufacturer’s supply chain to reduce turnaround times',
      'Synthesizing complex multi-stream analysis into a 2-minute CEO pitch'
    ],
    interviewStyle: 'Rigorous interactive case interview, structure testing, live quantitative mental math, and hypothesis-driven problem decomposition.',
    scoringDimensions: [
      { name: 'Problem Structuring & MECE Frameworks', description: 'Breaking down vague problems into exhaustive, non-overlapping issue trees' },
      { name: 'Quantitative & Mental Math Rigor', description: 'Speed, accuracy, reasonable assumptions, and sanity checking numbers' },
      { name: 'Business Intuition & Commercial Sense', description: 'Practical industry awareness, competitive dynamics, and realistic recommendations' },
      { name: 'Synthesis & Executive Communication', description: 'Structured, top-down communication using the Pyramid Principle' }
    ],
    sampleScenarios: [
      'CASE STUDY: A premier coffee shop chain with 200 locations notices their profit margin dropped from 18% to 9% over the past 18 months, even though revenue grew by 10%. Walk me through your issue tree to find the root cause.',
      'Estimate the number of commercial airplanes currently in flight over North America at 2:00 PM on a Tuesday. Walk me through your assumptions and math step by step.'
    ]
  }
];

// Helper to look up a role configuration by ID or Label
export function findRoleConfig(roleIdentifier: string): RoleConfig | undefined {
  const normalized = roleIdentifier.trim().toLowerCase();
  return PRESET_ROLE_CONFIGS.find(
    (r) =>
      r.id.toLowerCase() === normalized ||
      r.label.toLowerCase() === normalized
  );
}

// In-session cache for dynamically generated custom role configs
const customRolesCache = new Map<string, RoleConfig>();

export function getCachedCustomRole(roleName: string): RoleConfig | undefined {
  return customRolesCache.get(roleName.trim().toLowerCase());
}

export function setCachedCustomRole(roleName: string, config: RoleConfig): void {
  customRolesCache.set(roleName.trim().toLowerCase(), config);
}

