# API Testing Guide - Code Completion

This guide provides curl commands and Postman setup instructions for testing the
Code Completion API in both local (Ollama) and production (Vercel + HuggingFace)
environments.

## 📋 Table of Contents

- [Curl Commands](#curl-commands)
- [Progress Tracking & Streaming](#progress-tracking--streaming)
- [Postman Setup](#postman-setup)
- [Environment Variables](#environment-variables)
- [Example Requests](#example-requests)

---

## ⏱️ Progress Tracking & Streaming

### Console Progress Indicator

When testing the API, you'll see real-time progress updates in your console:

**Example Output:**

```
🎯 generateSuggestion - Starting AI Generation
Environment Detection:
  - isVercel: false
  - hasHuggingFaceKey: false
  - prompt length: 245 characters
  - prompt preview: You are an expert code completion assistant...
🟢 Using Ollama API (Local)
Using Ollama for code completion: { "model": "tinyllama", ... }
🔄 Sending request to Ollama (may take 5-10 minutes)...
⏳ Waiting for Ollama response... [5:23]
✅ Ollama response received in 323s: 200 OK
✅ Generation successful
  - suggestion length: 156 characters
```

**What you'll see:**

- ⏳ A live timer showing `[minutes:seconds]` elapsed
- 🔄 Progress indicator updates every second
- ✅ Final status with total time taken

### Streaming Mode

Enable streaming to see real-time output in Postman:

**Add to your request body:**

```json
{
  "fileContent": "...",
  "cursorLine": 5,
  "cursorColumn": 15,
  "suggestionType": "function",
  "fileName": "MyComponent.tsx",
  "stream": true
}
```

**What happens:**

- Text appears character-by-character in Postman
- Shows `Content-Type: text/event-stream`
- Great for monitoring long-running requests

---

## 🔧 Curl Commands

### Local Development (Ollama)

#### Test Basic React Component Completion

```bash
curl -X POST http://localhost:3000/api/code-completion \
  -H "Content-Type: application/json" \
  -d '{
    "fileContent": "import React from \"react\"\n\nconst MyComponent = () => {\n  return (\n    <div>\n      {/* TODO: Add content */}",
    "cursorLine": 5,
    "cursorColumn": 15,
    "suggestionType": "function",
    "fileName": "MyComponent.tsx"
  }'
```

#### Test TypeScript Interface Completion

```bash
curl -X POST http://localhost:3000/api/code-completion \
  -H "Content-Type: application/json" \
  -d '{
    "fileContent": "interface User {\n  name: string;\n  age: number;\n}\n\nconst getUser = (id: string): User => {\n  // TODO: Implement function",
    "cursorLine": 6,
    "cursorColumn": 23,
    "suggestionType": "function",
    "fileName": "user.ts"
  }'
```

#### Test Python Function Completion

```bash
curl -X POST http://localhost:3000/api/code-completion \
  -H "Content-Type: application/json" \
  -d '{
    "fileContent": "def calculate_total(items):\n  \"\"\"Calculate total price of items\"\"\"\n  total = 0\n  for item in items:\n    # TODO: Add price calculation",
    "cursorLine": 4,
    "cursorColumn": 20,
    "suggestionType": "statement",
    "fileName": "calculator.py"
  }'
```

#### Test with JavaScript Array Method

```bash
curl -X POST http://localhost:3000/api/code-completion \
  -H "Content-Type: application/json" \
  -d '{
    "fileContent": "const numbers = [1, 2, 3, 4, 5];\nconst doubled = numbers.",
    "cursorLine": 2,
    "cursorColumn": 28,
    "suggestionType": "method",
    "fileName": "arrays.js"
  }'
```

#### Test with Streaming Mode (Real-time Output)

```bash
curl -X POST http://localhost:3000/api/code-completion \
  -H "Content-Type: application/json" \
  -d '{
    "fileContent": "import React from \"react\"\n\nconst MyComponent = () => {\n  return (\n    <div>\n      {/* TODO: Add content */}",
    "cursorLine": 5,
    "cursorColumn": 15,
    "suggestionType": "function",
    "fileName": "MyComponent.tsx",
    "stream": true
  }'
```

**Note:** With streaming enabled (`"stream": true`), you'll see the response
appear character by character. This is ideal for monitoring long-running
requests.

---

### Production (Vercel + HuggingFace)

Replace `https://your-app.vercel.app` with your actual Vercel deployment URL.

#### Test Basic React Component Completion

```bash
curl -X POST https://your-app.vercel.app/api/code-completion \
  -H "Content-Type: application/json" \
  -d '{
    "fileContent": "import React from \"react\"\n\nconst MyComponent = () => {\n  return (\n    <div>\n      {/* TODO: Add content */}",
    "cursorLine": 5,
    "cursorColumn": 15,
    "suggestionType": "function",
    "fileName": "MyComponent.tsx"
  }'
```

#### Test TypeScript Interface Completion

```bash
curl -X POST https://your-app.vercel.app/api/code-completion \
  -H "Content-Type: application/json" \
  -d '{
    "fileContent": "interface User {\n  name: string;\n  age: number;\n}\n\nconst getUser = (id: string): User => {\n  // TODO: Implement function",
    "cursorLine": 6,
    "cursorColumn": 23,
    "suggestionType": "function",
    "fileName": "user.ts"
  }'
```

#### Test Python Function Completion

```bash
curl -X POST https://your-app.vercel.app/api/code-completion \
  -H "Content-Type: application/json" \
  -d '{
    "fileContent": "def calculate_total(items):\n  \"\"\"Calculate total price of items\"\"\"\n  total = 0\n  for item in items:\n    # TODO: Add price calculation",
    "cursorLine": 4,
    "cursorColumn": 20,
    "suggestionType": "statement",
    "fileName": "calculator.py"
  }'
```

---

## 🚀 Postman Setup

### Step 1: Import Collection

1. Open Postman
2. Click **Import** button (top left)
3. Select the `postman_collection.json` file from this project
4. Click **Import**

### Step 2: Configure Environments

#### Create Local Environment

1. Click **Environments** in the left sidebar
2. Click **Create Environment**
3. Name it: `Local Development`
4. Add variables:
   - Variable: `base_url_local`
   - Initial Value: `http://localhost:3000`
   - Current Value: `http://localhost:3000`
5. Click **Save**

#### Create Production Environment

1. Create another environment named: `Production (Vercel)`
2. Add variables:
   - Variable: `base_url_vercel`
   - Initial Value: `https://your-app.vercel.app`
   - Current Value: `https://your-app.vercel.app`
3. **Replace `your-app` with your actual Vercel deployment URL**
4. Click **Save**

### Step 3: Select Environment

1. In the top right corner of Postman
2. Click the environment dropdown
3. Select `Local Development` for testing locally
4. Select `Production (Vercel)` for testing on Vercel

### Step 4: Update Vercel URL

If you need to update the Vercel URL:

1. Select the `Production (Vercel)` environment
2. Click the eye icon to edit variables
3. Update the `base_url_vercel` variable with your actual Vercel URL

---

## 🌍 Environment Variables

### Required for Local Development (Ollama)

Ensure these are set in your `.env.local`:

```env
OLLAMA_HOST=http://ollama:11434
```

Or if running Ollama directly on your machine:

```env
OLLAMA_HOST=http://localhost:11434
```

### Required for Production (Vercel + HuggingFace)

Set in Vercel Dashboard → Settings → Environment Variables:

```env
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
VERCEL=true
```

---

## 📝 Expected Response Format

### Success Response

```json
{
  "suggestion": "const [count, setCount] = useState(0);\n  return <div>Count: {count}</div>;",
  "context": {
    "language": "TypeScript",
    "framework": "React",
    "beforeContext": "...",
    "currentLine": "const MyComponent = () => {",
    "afterContext": "...",
    "cursorPosition": {
      "line": 5,
      "column": 15
    },
    "isInFunction": true,
    "isInClass": false,
    "isAfterComment": true,
    "incompletePatterns": []
  },
  "metadata": {
    "language": "TypeScript",
    "framework": "React",
    "position": {
      "line": 5,
      "column": 15
    },
    "generatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Error Response

```json
{
  "error": "Invalid input parameters",
  "message": "Missing required field: fileContent",
  "type": "api_error"
}
```

---

## 🧪 Quick Test Checklist

### Before Testing

- [ ] Ollama is running locally (for local testing)
- [ ] Ollama model `tinyllama` is installed (`ollama pull tinyllama`)
- [ ] Server is running (`npm run dev`)
- [ ] HuggingFace API key is set (for Vercel testing)

### Test Scenarios

- [ ] React component completion
- [ ] TypeScript interface completion
- [ ] Python function completion
- [ ] JavaScript method completion
- [ ] Test with different cursor positions
- [ ] Test error handling (invalid input)

---

## 🐛 Troubleshooting

### Local (Ollama) Issues

**Problem**: Connection refused to `http://ollama:11434`

**Solution**: Update `.env.local` to use:

```env
OLLAMA_HOST=http://localhost:11434
```

**Problem**: Model not found

**Solution**: Install the model:

```bash
ollama pull tinyllama
```

### Production (Vercel) Issues

**Problem**: 401 Unauthorized

**Solution**: Check that `HUGGINGFACE_API_KEY` is correctly set in Vercel
environment variables

**Problem**: 503 Service Unavailable

**Solution**: The HuggingFace model may be loading. Wait a moment and try again.

---

## 📊 Logging

The API now includes comprehensive logging:

- **🎯 generateSuggestion** - Main function entry
- **🔵 HuggingFace API (Vercel)** - Using HuggingFace
- **🟢 Ollama API (Local)** - Using Ollama
- **✅ Generation successful** - Success confirmation
- **❌ AI generation error** - Error occurred

To view logs:

- **Local**: Check your terminal running `npm run dev`
- **Vercel**: Check Vercel Function Logs in your dashboard

---

## 📞 Support

For issues or questions:

1. Check console logs for detailed error messages
2. Verify environment variables are set correctly
3. Test with curl commands first to isolate the issue
4. Review the terminal/console output for the grouped logs
