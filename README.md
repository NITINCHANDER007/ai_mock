# 🎙️ InterviewAI - Autonomous AI Mock Interviewer

An intelligent, real-time voice mock interviewer web application powered by **Next.js**, **Google Gemini**, the **Web Speech API**, and **SpeechSynthesis**. Practice technical, behavioral, and domain interviews with an adaptive AI recruiter that speaks out loud, listens to your responses, handles conversational barge-in interruptions, and delivers a detailed performance scorecard with recruiter feedback.

---

## ✨ Features

- **🗣️ Natural Turn-Taking Voice Engine**:
  - Spoken questions using browser `SpeechSynthesis` with female voice auto-selection.
  - Hands-free speech recognition via the browser `SpeechRecognition` API.
  - Auto-submits answers after a brief natural pause (no button clicks needed).
  - **Barge-In Interruption**: Start speaking at any moment to politely interrupt the interviewer, just like in real life.
- **⚡ Powered by Google Gemini Flash**:
  - Fast, context-aware question formulation using `@google/genai`.
  - Adapts difficulty based on experience level (*Fresher*, *1-3 yrs*, *3+ yrs*).
  - Supports tailored interviews for *Software Engineer, Data Analyst, Product Manager, Designer, HR, Marketing, Sales, Customer Support*, and custom roles.
- **🌐 Multilingual Support**:
  - **English**, **Hindi (हिंदी)**, and **Hinglish** (natural conversational Roman-script Hindi + English blend).
- **📄 Resume & Job Description Parsing**:
  - Upload PDF or TXT resumes and job descriptions.
  - Generates personalized, targeted interview questions based on your projects and requirements.
- **📹 Self-View Camera Preview**:
  - Top-right mirrored self-preview camera with echo cancellation and noise suppression.
  - Strictly client-side (no video is recorded or uploaded).
- **📊 Comprehensive Feedback Report**:
  - Overall score out of 10.
  - Key candidate strengths.
  - Targeted areas for improvement.
  - Executive recruiter summary notes.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19
- **Styling**: Tailwind CSS with Cyber-Mesh Dark Glassmorphism UI
- **AI SDK**: Official `@google/genai` SDK
- **Speech**: Browser Web Speech API (`SpeechRecognition` & `SpeechSynthesis`)
- **Document Parsing**: `unpdf` for server-side PDF text extraction
- **Icons**: `lucide-react`

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/NITINCHANDER007/AI_MOCK.git
cd AI_MOCK
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure your Gemini API Key

Create a `.env.local` file in the root directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

> Get your API key from [Google AI Studio](https://aistudio.google.com/).

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser (Google Chrome or Chromium-based browsers recommended for Web Speech API support).

---

## 🎧 Best Experience Tips

- **Use Headphones**: Recommended to eliminate room echo and avoid mic feedback.
- **Grant Mic & Camera Permissions**: Allow browser permissions when prompted.
- **Browser Compatibility**: Works best in Google Chrome, Microsoft Edge, and modern Chromium browsers with Web Speech API support.

---

## 📄 License

MIT License. Feel free to use and customize for your own mock interview practice!
