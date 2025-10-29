# API Key Validation & Error Messages

This document explains how the code completion API validates API keys and what
error messages you'll see if they're missing.

## HuggingFace API Key Validation

### Error Messages

#### 1. **Provider Explicitly Requested but Key Missing**

When a developer explicitly requests HuggingFace API (`provider: "huggingface"`)
but the key is not set:

```json
{
  "error": "Internal server error",
  "message": "HUGGINGFACE_API_KEY is not available. Please set it in your environment variables.",
  "type": "api_error"
}
```

#### 2. **No AI Service Available (Vercel)**

On Vercel when no HuggingFace API key is configured:

```json
{
  "error": "Internal server error",
  "message": "HUGGINGFACE_API_KEY is not set. Please configure it in Vercel environment variables.",
  "type": "api_error"
}
```

#### 3. **No AI Service Available (Local)**

When running locally without any AI service:

```json
{
  "error": "Internal server error",
  "message": "No AI service available. Please set either HUGGINGFACE_API_KEY or ensure Ollama is running.",
  "type": "api_error"
}
```

## How to Set API Keys

### Local Development (.env.local)

```bash
# For HuggingFace
HUGGINGFACE_API_KEY=your_api_key_here

# For Ollama (optional)
OLLAMA_HOST=http://localhost:11434
```

### Vercel (Production)

1. Go to your Vercel project dashboard
2. Navigate to **Settings** > **Environment Variables**
3. Add `HUGGINGFACE_API_KEY` with your API key value
4. Select the environments (Production, Preview, Development)
5. Save and redeploy

## Error Response Format

All errors follow this structure:

```json
{
  "error": "Error category",
  "message": "Detailed error message",
  "type": "api_error"
}
```

### HTTP Status Codes

- `400` - Invalid input parameters
- `500` - Internal server error (API key missing, service unavailable)
- `503` - Service temporarily unavailable
- `504` - Request timeout

## Validation Logic

The API validates API keys in this order:

1. **Explicit Provider Check**: If `provider: "huggingface"` is requested,
   validates that `HUGGINGFACE_API_KEY` exists
2. **Environment Detection**: Checks if running on Vercel (requires HuggingFace
   key)
3. **Fallback Providers**: Tries available services in order of priority
4. **Error Generation**: Provides specific error messages based on missing
   resources

## Testing Without API Keys

To test error handling, you can:

1. **Temporarily remove the key**: Comment out `HUGGINGFACE_API_KEY` in
   `.env.local`
2. **Request specific provider**: Use `"provider": "huggingface"` in request
   body
3. **Check error response**: The API will return a helpful error message

## Example Error Handling

The frontend receives these errors and displays them to users via toast
notifications:

```typescript
// Error messages are automatically surfaced to users
if (error.message.includes('HUGGINGFACE_API_KEY')) {
  toast.error('API Key Required', {
    description:
      'Please configure HUGGINGFACE_API_KEY in environment variables.',
    duration: 5000,
  });
}
```

## Next Steps

If you encounter API key errors:

1. Check that the key is set in the correct environment file
2. Restart your development server after setting environment variables
3. For Vercel, ensure the key is set in the dashboard and redeploy
4. Verify the key is valid by testing with a simple curl command
