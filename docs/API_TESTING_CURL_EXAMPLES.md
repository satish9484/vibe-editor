# Code Completion API - cURL Testing Examples

This document provides cURL commands for testing the code completion API on both
local development and production (Vercel) environments.

## Prerequisites

- **Local**: Requires `HUGGINGFACE_API_KEY` in `.env.local`
- **Vercel**: Automatically uses HuggingFace API with `HUGGINGFACE_API_KEY`
  environment variable set in Vercel dashboard

## Environment Variables

Set these variables before testing:

**Local (.env.local)**:

```bash
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
```

**Vercel Dashboard**:

- `HUGGINGFACE_API_KEY` - Your HuggingFace API key

## cURL Examples

### 1. Basic Code Completion (Recommended)

Simple React component completion:

```bash
curl -X POST http://localhost:3000/api/code-completion \
  -H "Content-Type: application/json" \
  -d '{
    "fileContent": "import React from '\''react'\'';\n\nfunction App() {\n  return <div>|CURSOR|</div>;\n}",
    "cursorLine": 3,
    "cursorColumn": 15,
    "suggestionType": "line-completion",
    "fileName": "App.jsx",
    "provider": "huggingface"
  }'
```

### 2. React Component Completion

```bash
curl -X POST http://localhost:3000/api/code-completion \
  -H "Content-Type: application/json" \
  -d '{
    "fileContent": "import { useState } from '\''react'\''\n\nfunction App() {\n  const [count, setCount] = useState(0)\n  return (\n    <div>\n      <button onClick={() => setCount((count) => count + 1)}>\n        count is {count}\n      </button>\n    </div>\n  )\n}\n\nexport default App\n",
    "cursorLine": 6,
    "cursorColumn": 12,
    "suggestionType": "completion"
  }'
```

### 3. TypeScript Function Completion

```bash
curl -X POST http://localhost:3000/api/code-completion \
  -H "Content-Type: application/json" \
  -d '{
    "fileContent": "interface User {\n  name: string;\n  age: number;\n}\n\nconst getUser = (id: string): User => {",
    "cursorLine": 6,
    "cursorColumn": 23,
    "suggestionType": "function",
    "fileName": "user.ts",
    "provider": "huggingface"
  }'
```

### 4. Python Statement Completion

```bash
curl -X POST http://localhost:3000/api/code-completion \
  -H "Content-Type: application/json" \
  -d '{
    "fileContent": "def calculate_total(items):\n  \"\"\"Calculate total price\"\"\"\n  total = 0\n  for item in items:",
    "cursorLine": 4,
    "cursorColumn": 18,
    "suggestionType": "statement",
    "fileName": "calculator.py"
  }'
```

### 5. Production (Vercel)

```bash
curl -X POST https://vibe-editor-two.vercel.app/api/code-completion \
  -H "Content-Type: application/json" \
  -d '{
    "fileContent": "import React from '\''react'\'';\n\nfunction App() {\n  return <div>Hello</div>;\n}",
    "cursorLine": 3,
    "cursorColumn": 15,
    "suggestionType": "completion"
  }'
```

## Expected Response

The API returns a JSON response with the suggestion and metadata:

```json
{
  "suggestion": "your generated code here",
  "context": {
    "language": "JavaScript",
    "framework": "React",
    "beforeContext": "...",
    "currentLine": "...",
    "afterContext": "...",
    "cursorPosition": { "line": 3, "column": 15 },
    "isInFunction": true,
    "isInClass": false,
    "isAfterComment": false,
    "incompletePatterns": []
  },
  "metadata": {
    "language": "JavaScript",
    "framework": "React",
    "position": { "line": 3, "column": 15 },
    "generatedAt": "2025-01-20T10:30:00.000Z"
  }
}
```

### Success Response Example

```json
{
  "suggestion": "<h1>Hello World</h1>",
  "context": {
    "language": "JavaScript",
    "framework": "React",
    "isInFunction": true
  },
  "metadata": {
    "language": "JavaScript",
    "generatedAt": "2025-01-20T10:30:00.000Z"
  }
}
```

### Error Response Example

```json
{
  "error": "Internal server error",
  "message": "HUGGINGFACE_API_KEY is not available. Please set it in your environment variables.",
  "type": "api_error"
}
```

## Request Body Schema

All requests require:

- `fileContent` (string): The code content as a string
- `cursorLine` (number): Line number (0-indexed)
- `cursorColumn` (number): Column number (0-indexed)
- `suggestionType` (string): "completion", "function", or "statement"

Optional fields:

- `fileName` (string): Filename for context
- `stream` (boolean): Enable streaming mode
- `provider` (string): Force "huggingface" or "ollama"

## Error Codes

- `400` - Invalid input parameters
- `404` - Model not found
- `500` - Internal server error
- `503` - Service temporarily unavailable

## Testing Tips

1. **Local Testing**: Ensure `HUGGINGFACE_API_KEY` is set in `.env.local`
2. **Vercel Testing**: Make sure `HUGGINGFACE_API_KEY` is set in Vercel
   dashboard environment variables
3. **Cursor Position**: The cursor line and column are 0-indexed (first line is
   0, first column is 0)
4. **Timeout**: AI calls typically take 5-15 seconds
5. **Models**: The API tries these models in order: DeepSeek V3, StarCoder2
   (15B/7B/3B), StarCoder, CodeGen

## Windows cURL Syntax

On Windows, use double quotes for the entire JSON body:

```bash
curl -X POST http://localhost:3000/api/code-completion -H "Content-Type: application/json" -d "{\"fileContent\":\"test\",\"cursorLine\":0,\"cursorColumn\":0,\"suggestionType\":\"completion\",\"provider\":\"huggingface\"}"
```

## Postman Collection

Import the `postman_collection.json` file in the root directory for a
ready-to-use collection with all these examples.

## Next Steps

After testing, you can integrate these endpoints into your application. See the
main API documentation for full integration details.
