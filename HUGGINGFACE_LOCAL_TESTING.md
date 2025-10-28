# HuggingFace Local Testing Guide

## 🎯 Overview

This guide shows you how to test HuggingFace API locally **without deploying to
Vercel**.

## 📋 Prerequisites

1. **HuggingFace API Key**
   - Sign up at [https://huggingface.co](https://huggingface.co)
   - Get your API key from
     [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)

2. **Environment Variable** Add to your `.env.local`:
   ```env
   HUGGINGFACE_API_KEY=your_api_key_here
   ```

---

## 🔧 Method 1: Force HuggingFace Provider

Add `"provider": "huggingface"` to your request body to force HuggingFace usage
even when running locally.

### Curl Command

```bash
curl -X POST http://localhost:3000/api/code-completion \
  -H "Content-Type: application/json" \
  -d '{
    "fileContent": "import React from \"react\"\n\nconst MyComponent = () => {\n  return (\n    <div>\n      {/* TODO: Add content */}",
    "cursorLine": 5,
    "cursorColumn": 15,
    "suggestionType": "function",
    "fileName": "MyComponent.tsx",
    "provider": "huggingface"
  }'
```

### Expected Console Output

```
🎯 generateSuggestion - Starting AI Generation
Environment Detection:
  - isVercel: false
  - hasHuggingFaceKey: true
  - requestedProvider: huggingface
  - prompt length: 245 characters
🔵 Using HuggingFace API (Requested)
Using Hugging Face API for code completion
✅ Generation successful
```

---

## 🔧 Method 2: Direct HuggingFace API Call

Test HuggingFace API directly without going through your Next.js server.

### Get Your API Key

1. Go to
   [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
2. Create a new token with **read** permissions
3. Copy the token

### Curl Commands

#### Test with CodeBERT Model

```bash
curl -X POST https://api-inference.huggingface.co/models/microsoft/CodeBERT-base \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "inputs": "You are an expert code completion assistant. Generate a function suggestion.\n\nLanguage: TypeScript\nFramework: React\n\nContext:\nimport React from \"react\"\n\nconst MyComponent = () => {\n  return (\n    <div>\n      {/* TODO: Add content */}\n\nGenerate suggestion:",
    "parameters": {
      "max_length": 300,
      "temperature": 0.7,
      "do_sample": true,
      "top_p": 0.9
    }
  }'
```

#### Test with StarCoder Model (Better for Code)

```bash
curl -X POST https://api-inference.huggingface.co/models/bigcode/starcoder \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "inputs": "def calculate_total(items):\n  \"\"\"Calculate total price\"\"\"\n  total = 0\n  for item in items:\n    # TODO: Add calculation",
    "parameters": {
      "max_new_tokens": 50,
      "temperature": 0.2,
      "top_p": 0.95
    }
  }'
```

#### Test with InCoder Model

```bash
curl -X POST https://api-inference.huggingface.co/models/facebook/incoder-1B \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "inputs": "function calculateSum(numbers) {\n  // TODO: implement",
    "parameters": {
      "max_new_tokens": 100,
      "temperature": 0.8
    }
  }'
```

---

## 📊 Response Format

### Expected Response from HuggingFace

```json
[
  {
    "generated_text": "const [count, setCount] = useState(0);\n  return <div>Count: {count}</div>;"
  }
]
```

Or if the model is loading:

```json
{
  "error": "Model facebook/incoder-1B is currently loading",
  "estimated_time": 60
}
```

---

## 🧪 Testing Different Models

### Recommended Models for Code Completion

1. **bigcode/starcoder** - Best for code generation (large model)
2. **bigcode/starcoderbase** - Base version
3. **facebook/incoder-1B** - Lightweight, good for completions
4. **microsoft/CodeBERT-base** - Code understanding
5. **Salesforce/codegen-350M-mono** - Good for Python

### Example: Test with StarCoder

```bash
export HF_API_KEY="your_key_here"

curl -X POST https://api-inference.huggingface.co/models/bigcode/starcoder \
  -H "Authorization: Bearer $HF_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "inputs": "def fibonacci(n):\n  if n <= 1:\n    return n\n  ",
    "parameters": {
      "max_new_tokens": 20,
      "temperature": 0.2
    }
  }'
```

---

## 🔄 Compare Ollama vs HuggingFace

### Test Ollama (Default Local)

```bash
curl -X POST http://localhost:3000/api/code-completion \
  -H "Content-Type: application/json" \
  -d '{
    "fileContent": "const x =",
    "cursorLine": 1,
    "cursorColumn": 10,
    "suggestionType": "statement"
  }'
```

### Test HuggingFace (Forced)

```bash
curl -X POST http://localhost:3000/api/code-completion \
  -H "Content-Type: application/json" \
  -d '{
    "fileContent": "const x =",
    "cursorLine": 1,
    "cursorColumn": 10,
    "suggestionType": "statement",
    "provider": "huggingface"
  }'
```

---

## 🛠️ Troubleshooting

### Issue: "Invalid API key"

**Solution:**

```bash
# Check your .env.local file
cat .env.local | grep HUGGINGFACE

# Or set it directly
export HUGGINGFACE_API_KEY="your_key"
```

### Issue: "Model is currently loading"

**Solution:** Wait for the model to load (usually 30-60 seconds for first
request), then retry.

### Issue: "Rate limit exceeded"

**Solution:**

- Free tier has limited requests
- Wait a few minutes between requests
- Consider upgrading to Pro plan

### Issue: Provider not working

**Solution:**

1. Check console logs: `requestedProvider: huggingface`
2. Verify API key is set: `hasHuggingFaceKey: true`
3. Check HuggingFace dashboard for API status

---

## 📝 Update Your Code to Use Different Models

If you want to use a different HuggingFace model, edit `generateWithHuggingFace`
in `app/api/code-completion/route.ts`:

```typescript
const response = await fetch(
  'https://api-inference.huggingface.co/models/YOUR_MODEL_NAME',
  {
    // ... rest of code
  }
);
```

**Available Models:**

- `bigcode/starcoder` - Best overall
- `facebook/incoder-1B` - Fastest
- `Salesforce/codegen-350M-mono` - Python focused

---

## ✅ Quick Test Checklist

- [ ] Got HuggingFace API key
- [ ] Added `HUGGINGFACE_API_KEY` to `.env.local`
- [ ] Restarted dev server
- [ ] Tested direct API call with curl
- [ ] Tested via Next.js with `provider: "huggingface"`
- [ ] Checked console logs to confirm provider

---

## 🚀 Next Steps

1. Test with curl commands above
2. Add requests to your Postman collection
3. Compare results between Ollama and HuggingFace
4. Choose the best provider for your use case

Happy testing! 🎉
