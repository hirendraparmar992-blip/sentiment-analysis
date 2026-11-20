# E-Consultation AI Sentiment Analysis Platform

An enterprise-grade, full-stack real-time Sentiment Analysis and Public Feedback Intelligence platform designed for municipal and government e-consultation initiatives. Powered by **Google Gemini 1.5 Flash** for deep natural language classification and **Socket.io** for real-time live dashboard synchronization.

---

## 🌟 Key Features

- **Feedback Overview Dashboard**: Real-time counter cards tracking Total Submissions, Positive Sentiment, Negative Sentiment, and Neutral/Queries with percentage distributions.
- **Sentiment Distribution Visualization**: Live progress tracks and multi-segment meter calculating positive, negative, and neutral percentages.
- **Topic Distribution Breakdown**: Granular segmentation across key public consultation sectors:
  - 🏥 Healthcare
  - 🎓 Education
  - 🚌 Transportation
  - 🏛️ Public Services
  - 📦 Other
- **AI Comment Analysis**: Generative classification utilizing Google Gemini 1.5 Flash:
  - **Sentiment**: Positive / Negative / Neutral
  - **Topic**: Healthcare / Education / Transportation / Public Services / Other
  - **Emotion**: Happy (😄), Angry (😡), Sad (😢), Neutral (😐), Concerned (😟)
  - **Priority Urgency Triage**: High / Medium / Low
  - **Confidence Metric**: 0 - 100%
  - **Keywords Extraction**: Key topic terms
  - **Executive Summary**: One-sentence natural language takeaway
  - *Resilient Fallback*: Built-in heuristic NLP classifier if no API key is supplied or during offline execution.
- **Urgency Triage & Priority Analysis**: High-priority alerts with red left-border callouts for immediate civil administrator intervention.
- **5-Dimension Emotion Detection**: Affective tracking across Happy, Angry, Sad, Neutral, and Concerned tones.
- **Real-Time Data Streaming**: Bidirectional updates over WebSockets (Socket.io) with live toast notifications.
- **Executive Consultation Reports**: Health index scoring, policy recommendations, and CSV export.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Single Page Application (SPA), Semantic HTML5, Custom CSS3 (Navy Design System), Vanilla JS (ES6+), FontAwesome 6, Socket.io Client |
| **Backend** | Node.js, Express.js 4, Socket.io Server, CORS, dotenv, Body-Parser |
| **AI / NLP** | `@google/generative-ai` (Gemini 1.5 Flash) with fallback rule-based analyzer |
| **Database** | MongoDB with Mongoose (includes automatic, zero-config in-memory fallback store if MongoDB is not running) |

---

## 📁 Project Structure

```
sentiment-analysis/
├── README.md
├── backend/
│   ├── data/
│   │   └── policies.js
│   ├── middleware/
│   │   └── auth.js
│   ├── .env.example
│   ├── .env
│   ├── package.json
│   ├── server.js
│   ├── models/
│   │   ├── Comment.js
│   │   └── User.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── comments.js
│   │   └── policies.js
│   └── services/
│       └── aiAnalysis.js
└── frontend/
    ├── index.html
    ├── css/
    │   └── style.css
    └── js/
        └── app.js
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** (comes with Node.js)
- **MongoDB**: Local MongoDB works for development. The in-memory fallback is temporary; persistent accounts and feedback require MongoDB. For deployment, use a hosted database such as MongoDB Atlas rather than `localhost`.
- **Gemini API Key** *(Optional)*: To use Google Gemini 1.5 Flash for AI analysis. Obtain a key from [Google AI Studio](https://aistudio.google.com/).

---

### 2. Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env` (or edit existing `.env`):
   ```env
   MONGODB_URI=mongodb://localhost:27017/sentiment_analysis
   GEMINI_API_KEY=your_gemini_api_key_here
  AUTH_TOKEN_SECRET=replace_with_a_long_random_secret
  FRONTEND_ORIGIN=http://localhost:5500
   PORT=3001
   ```
   > **Note:** If you leave `GEMINI_API_KEY` blank or unconfigured, the system automatically uses its built-in heuristic analysis engine, allowing full local demonstration.

  Set `AUTH_TOKEN_SECRET` to a long, random value in production. The application requires it when `NODE_ENV=production`; local development uses a temporary per-start secret when it is omitted.

Start the server and create an account from the sign-in page. Passwords must be at least 8 characters. The Government Policies page lists seven schemes; feedback submitted from a scheme is linked to that policy.

---

### 3. Running the Server

Start the application:
```bash
# Production mode
npm start

# Or Development mode (with live reload)
npm run dev
```

Open your browser and navigate to:
```
http://localhost:3001
```

The Express server serves both the static frontend and the REST/Socket API on port `3001`.

---

## 📡 API Reference

### 1. Get All Comments
```http
GET /api/comments?topic=Healthcare&sentiment=Positive&priority=High&limit=50
```
**Response:**
```json
{
  "success": true,
  "source": "database",
  "count": 6,
  "data": [
    {
      "_id": "6727289f310f8a...",
      "text": "The hospital staff were prompt and polite.",
      "sentiment": "Positive",
      "topic": "Healthcare",
      "emotion": "Happy",
      "priority": "Low",
      "confidence": 95,
      "keywords": ["hospital", "prompt", "polite"],
      "summary": "Praise for healthcare staff promptness.",
      "createdAt": "2026-11-03T00:15:00.000Z"
    }
  ]
}
```

### 2. Analyze Comment with AI
```http
POST /api/comments/analyze
Content-Type: application/json

{
  "text": "The public school digital portal crashed during semester enrollment. Unacceptable!"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Comment analyzed and recorded successfully",
  "data": {
    "text": "The public school digital portal crashed during semester enrollment. Unacceptable!",
    "sentiment": "Negative",
    "topic": "Education",
    "emotion": "Angry",
    "priority": "High",
    "confidence": 94,
    "keywords": ["portal crash", "enrollment", "school"],
    "summary": "Complaint concerning digital enrollment portal failure.",
    "createdAt": "2026-11-03T00:18:00.000Z"
  }
}
```

### 3. Get Aggregated Statistics
```http
GET /api/comments/stats
```
**Response:**
```json
{
  "success": true,
  "data": {
    "total": 12,
    "positive": 5,
    "negative": 4,
    "neutral": 3,
    "byTopic": {
      "Healthcare": 3,
      "Education": 3,
      "Transportation": 4,
      "Public Services": 2,
      "Other": 0
    },
    "byEmotion": {
      "Happy": 4,
      "Angry": 2,
      "Sad": 1,
      "Neutral": 3,
      "Concerned": 2
    },
    "byPriority": {
      "High": 3,
      "Medium": 6,
      "Low": 3
    }
  }
}
```

### 4. Delete Comment
```http
DELETE /api/comments/:id
```

---

## ⚡ Real-Time WebSocket Events (Socket.io)

| Event Name | Direction | Payload | Description |
|---|---|---|---|
| `new-comment` | Server ➔ Client | `Comment` object | Broadcast when new feedback is submitted and analyzed |
| `stats-update` | Server ➔ Client | `Stats` object | Emitted after changes to refresh counters and charts |
| `comment-deleted` | Server ➔ Client | `{ id: string }` | Broadcast when a comment is deleted |

---

## 🎨 UI & Design Specifications

- **Sidebar**: Dark navy (`#0a134a` to `#0d1b6b`) with glowing AI brand emblem, active blue state highlights, and real-time connectivity status dot.
- **Stat Cards**: Color-coded soft backgrounds with high-contrast indicator figures and sub-metric percentages.
- **Color Coding**:
  - Positive / Happy: Emerald green (`#10b981`)
  - Negative / Angry / Sad: Crimson red (`#ef4444`)
  - Neutral / Inquiries: Amber yellow (`#f59e0b`)
  - High Priority: Left accent bar (`6px solid #ef4444`)
- **Responsive**: Auto-reflowing CSS Grid and Flexbox down to mobile device widths with sliding sidebar toggle.
