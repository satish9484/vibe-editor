# 🚀 VibeCode Editor

> **AI-Powered Browser-Based Code Editor with Live Preview**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com/)

VibeCode Editor is a powerful, intelligent code editor that runs entirely in
your browser. Built with Next.js and powered by AI, this learning project
demonstrates modern web development techniques with real-time preview, multiple
framework templates, and intelligent code completion.

## 📸 Demo

> **screenshots**
>
> ![Screenshot 1](public/VB_2.png) ![Screenshot 2](public/VB_3.png)

## ✨ Features

### 🤖 AI-Powered Development

- **Intelligent Code Completion** powered by Ollama (TinyLlama/CodeLlama)
- **Context-aware suggestions** based on your current code
- **Real-time AI assistance** for faster development

### 🎯 Monaco Editor Integration

- **Full-featured code editor** with syntax highlighting
- **IntelliSense** and auto-completion
- **Multi-language support** for all major frameworks
- **Dark/Light theme** support

### 🌐 Browser-Based Execution

- **WebContainer API** for running code directly in the browser
- **Real-time terminal** with full command support
- **Live preview** of your applications
- **No server setup required**

### 📦 Multiple Framework Templates

- **React** - Component-based UI library
- **Next.js** - Full-stack React framework
- **Vue.js** - Progressive JavaScript framework
- **Angular** - Complete web application platform
- **Express** - Minimalist Node.js web framework
- **Hono** - Fast, lightweight web framework

### 🔐 Authentication & Project Management

- **Google & GitHub OAuth** integration
- **User dashboard** for project management
- **Project persistence** with MongoDB
- **Star/favorite** projects functionality

## 🛠️ Tech Stack

### Frontend

- **Next.js 15** - React framework with App Router
- **React 19** - UI library with latest features
- **TypeScript 5** - Type-safe JavaScript
- **Tailwind CSS 4** - Utility-first CSS framework
- **Monaco Editor** - VS Code editor in the browser

### Backend & Database

- **Next.js API Routes** - Serverless API endpoints
- **NextAuth** - Authentication for Next.js
- **Prisma** - Database ORM
- **MongoDB Atlas** - Cloud database service

### AI & Infrastructure

- **Ollama** - Local AI model server
- **TinyLlama/CodeLlama** - Code generation models
- **Docker** - Containerized development
- **WebContainer API** - Browser-based Node.js runtime

### UI Components

- **Radix UI** - Unstyled, accessible components
- **shadcn/ui** - Beautiful component library
- **Lucide React** - Icon library

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 22.13.1+** - [Download here](https://nodejs.org/)
- **Docker & Docker Compose** -
  [Install Docker](https://docs.docker.com/get-docker/)
- **MongoDB Atlas account** - [Sign up here](https://www.mongodb.com/atlas) (or
  local MongoDB)
- **Google OAuth credentials** -
  [Google Cloud Console](https://console.cloud.google.com/)
- **GitHub OAuth credentials** -
  [GitHub Developer Settings](https://github.com/settings/developers)

## 🚀 Quick Start

### Option 1: Docker Setup (Recommended)

1. **Clone the repository**

   ```bash
   git clone https://github.com/satish9484/vibe-editor.git
   cd vibe-editor
   ```

2. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

3. **Start with Docker**

   ```bash
   # Make scripts executable
   chmod +x docker-scripts.sh

   # Build and start the application
   ./docker-scripts.sh build
   ./docker-scripts.sh start
   ```

4. **Access the application**
   - **Main App**: http://localhost:3000
   - **Ollama API**: http://localhost:11434

### Option 2: Local Development

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

3. **Set up the database**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

## 🔧 Environment Variables

Copy `.env.example` to `.env` and configure the following variables:

### Required Variables

```env
# Database Configuration
DATABASE_URL="mongodb+srv://<username>:passw<ord@cluster.mongodb.net/<databasename>?retryWrites=true&w=majority"

# Authentication Configuration
AUTH_SECRET="your-super-secret-auth-key-here"
AUTH_GOOGLE_ID="your-google-oauth-client-id"
AUTH_GOOGLE_SECRET="your-google-oauth-client-secret"
AUTH_GITHUB_ID="your-github-oauth-client-id"
AUTH_GITHUB_SECRET="your-github-oauth-client-secret"

# Application Configuration
NEXTAUTH_URL="http://localhost:3000"
```

### OAuth Setup Instructions

#### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add `http://localhost:3000/api/auth/callback/google` to authorized redirect
   URIs

#### GitHub OAuth

1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Click "New OAuth App"
3. Set Authorization callback URL to
   `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID and Client Secret to your `.env` file

## 💻 Development Workflow

### Local Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Format code
npm run format

# Database operations
npx prisma generate    # Generate Prisma client
npx prisma db push     # Push schema changes
npx prisma studio     # Open Prisma Studio
```

### Docker Development Commands

```bash
# Build and start
./docker-scripts.sh build-start

# View logs
./docker-scripts.sh logs

# Stop services
./docker-scripts.sh stop

# Restart services
./docker-scripts.sh restart

# Clean up
./docker-scripts.sh clean
```

## 📁 Project Structure

```
vibe-editor/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (root)/            # Public pages
│   ├── api/               # API routes
│   ├── dashboard/         # User dashboard
│   └── playground/        # Code editor playground
├── components/            # Reusable UI components
│   └── ui/               # shadcn/ui components
├── modules/              # Feature modules
│   ├── auth/             # Authentication module
│   ├── dashboard/         # Dashboard module
│   ├── playground/       # Playground module
│   └── webcontainers/    # WebContainer integration
├── vibecode-starters/    # Framework templates
│   ├── react-ts/         # React TypeScript template
│   ├── nextjs-new/      # Next.js template
│   ├── vue/             # Vue.js template
│   ├── angular/         # Angular template
│   ├── express-simple/  # Express.js template
│   └── hono-nodejs-starter/ # Hono template
├── lib/                 # Utility libraries
├── prisma/              # Database schema
└── public/              # Static assets
```

## 📦 Available Templates

| Template    | Category  | Description                       | Tech Stack                 |
| ----------- | --------- | --------------------------------- | -------------------------- |
| **React**   | Frontend  | Component-based UI library        | React, TypeScript, Vite    |
| **Next.js** | Fullstack | React framework for production    | Next.js, React, TypeScript |
| **Vue.js**  | Frontend  | Progressive JavaScript framework  | Vue 3, TypeScript, Vite    |
| **Angular** | Fullstack | Complete web application platform | Angular, TypeScript        |
| **Express** | Backend   | Minimalist Node.js web framework  | Express.js, Node.js        |
| **Hono**    | Backend   | Fast, lightweight web framework   | Hono, Bun, TypeScript      |

## 🤖 AI Features

### AI Service Configuration

The application automatically switches between AI services based on the
environment:

| Environment           | AI Service   | Model               | Cost                     | Setup        |
| --------------------- | ------------ | ------------------- | ------------------------ | ------------ |
| **Local Development** | Ollama       | TinyLlama/CodeLlama | Free                     | Docker setup |
| **Vercel Production** | Hugging Face | CodeBERT            | Free (1K requests/month) | API key      |

### Local Development (Ollama)

For local development, the app uses Ollama with these models:

| Model                | Size   | RAM Required | Performance                      |
| -------------------- | ------ | ------------ | -------------------------------- |
| **TinyLlama**        | 637 MB | 1GB+         | Fast, good for basic suggestions |
| **CodeLlama:7b**     | 3.8 GB | 6GB+         | Better code understanding        |
| **CodeLlama:latest** | 3.8 GB | 6GB+         | Latest improvements              |

#### Ollama Model Management

```bash
# List installed models
docker-compose exec ollama ollama list

# Pull a new model
docker-compose exec ollama ollama pull tinyllama

# Test a model
docker-compose exec ollama ollama run tinyllama "Hello"
```

### Vercel Deployment (Hugging Face)

For Vercel deployment, the app uses Hugging Face Inference API:

#### Setup Steps

1. **Create Hugging Face account** (free)
   - Go to [huggingface.co](https://huggingface.co)
   - Sign up for a free account

2. **Get API token**
   - Go to [Settings > Access Tokens](https://huggingface.co/settings/tokens)
   - Create a new token with "Read" permissions

3. **Add to Vercel environment variables**
   ```
   HUGGINGFACE_API_KEY=hf_your_token_here
   ```

#### Hugging Face Benefits

- ✅ **Free tier**: 1,000 requests/month
- ✅ **No credit card** required
- ✅ **CodeBERT model** optimized for code completion
- ✅ **Automatic scaling** on Vercel
- ✅ **No local setup** required

### Switching AI Services

The app automatically detects the environment:

```typescript
// Automatic detection in app/api/code-completion/route.ts
const isVercel = process.env.VERCEL;
const huggingFaceApiKey = process.env.HUGGINGFACE_API_KEY;

if (isVercel && huggingFaceApiKey) {
  // Use Hugging Face for Vercel deployment
  return await generateWithHuggingFace(prompt, huggingFaceApiKey);
} else if (!isVercel) {
  // Use Ollama for local development
  return await generateWithOllama(prompt);
}
```

## 🐳 Docker Deployment

For detailed Docker deployment instructions, see
[DOCKER-README.md](DOCKER-README.md).

## 🚀 Vercel Deployment

### Prerequisites

- Vercel account (free)
- Hugging Face account (free)
- MongoDB Atlas database
- Google/GitHub OAuth credentials

### Quick Deploy Steps

1. **Fork this repository** to your GitHub account

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Import your forked repository

3. **Set Environment Variables** Add these in your Vercel project settings:

   ```
   DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/vibe-editor?retryWrites=true&w=majority
   AUTH_SECRET=your-super-secret-auth-key-here
   AUTH_GOOGLE_ID=your-google-oauth-client-id
   AUTH_GOOGLE_SECRET=your-google-oauth-client-secret
   AUTH_GITHUB_ID=your-github-oauth-client-id
   AUTH_GITHUB_SECRET=your-github-oauth-client-secret
   HUGGINGFACE_API_KEY=hf_your_huggingface_token_here
   NEXTAUTH_URL=https://your-app-name.vercel.app
   ```

4. **Deploy**
   - Vercel will automatically deploy on every push to main branch
   - Your app will be available at `https://your-app-name.vercel.app`

### Environment Variables for Vercel

| Variable              | Description                     | Required |
| --------------------- | ------------------------------- | -------- |
| `DATABASE_URL`        | MongoDB Atlas connection string | ✅       |
| `AUTH_SECRET`         | NextAuth secret key             | ✅       |
| `AUTH_GOOGLE_ID`      | Google OAuth client ID          | ✅       |
| `AUTH_GOOGLE_SECRET`  | Google OAuth client secret      | ✅       |
| `AUTH_GITHUB_ID`      | GitHub OAuth client ID          | ✅       |
| `AUTH_GITHUB_SECRET`  | GitHub OAuth client secret      | ✅       |
| `HUGGINGFACE_API_KEY` | Hugging Face API token          | ✅       |
| `NEXTAUTH_URL`        | Your Vercel domain              | ✅       |

### Vercel vs Local Development

| Feature         | Local Development  | Vercel Production       |
| --------------- | ------------------ | ----------------------- |
| **AI Service**  | Ollama (TinyLlama) | Hugging Face (CodeBERT) |
| **Database**    | MongoDB Atlas      | MongoDB Atlas           |
| **Cost**        | Free               | Free                    |
| **Setup**       | Docker required    | No setup needed         |
| **AI Requests** | Unlimited          | 1,000/month             |

## 🐛 Troubleshooting

### Common Issues

**Port already in use**

```bash
# Check what's using the port
lsof -i :3000
# Kill the process or change port in docker-compose.yml
```

**Ollama model not loading**

```bash
# Pull the model manually
./docker-scripts.sh pull-model
# Check Ollama logs
docker-compose logs ollama
```

**Database connection issues**

```bash
# Check MongoDB status
docker-compose ps mongodb
# Run migrations
./docker-scripts.sh db-migrate
```

**Build failures**

```bash
# Clean and rebuild
./docker-scripts.sh clean
./docker-scripts.sh build
```

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [WebContainer API](https://webcontainer.dev/)
- [Ollama Documentation](https://ollama.ai/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth Documentation](https://next-auth.js.org/)

## 🙏 Acknowledgments

This is a learning project built with the following amazing technologies:

- [Monaco Editor](https://microsoft.github.io/monaco-editor/) for the amazing
  code editor
- [WebContainer](https://webcontainer.dev/) for browser-based Node.js runtime
- [Ollama](https://ollama.ai/) for local AI model serving
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Next.js](https://nextjs.org/) team for the excellent framework

---
