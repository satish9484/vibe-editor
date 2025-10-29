# Logging Configuration Guide

## Overview

All debug/info `console.log()` statements are commented out in both API routes
and WebContainer components. Only `console.error()` statements remain active for
debugging critical issues.

## Files Updated

- ✅ `app/api/code-completion/route.ts` - AI code completion API
- ✅ `modules/webcontainers/components/webcontainer-preview.tsx` - WebContainer
  preview component

## Console Log Status

### ✅ Active Error Logs (Always On)

These error logs remain **active** and will always appear in console:

### Code Completion API (`app/api/code-completion/route.ts`)

- `console.error('❌ Context analysis error:', error)` - Request handling errors
- `console.error('❌ No AI service available')` - No provider available
- `console.error('❌ AI generation error:', error)` - AI generation failures
- `console.error('Final error message:', errorMsg)` - Final error messages
- `console.error('Ollama error response:', errorText)` - Ollama API errors
- `console.error('Ollama generation error:', error)` - Ollama generation
  failures
- `console.error('Hugging Face generation error:', error)` - HuggingFace API
  errors

### WebContainer Preview (`modules/webcontainers/components/webcontainer-preview.tsx`)

- `console.error('❌ ERROR: Could not read package.json:', error)` -
  package.json read errors
- `console.error('❌ FAILED: npm install failed', { exitCode })` - npm install
  failures
- `console.error('❌ ERROR: WebContainer setup failed:', err)` - Setup failures
- `console.error('⚠️ Error stopping server process:', error)` - Server stop
  errors
- `console.error('⚠️ CLEANUP: Error stopping server process:', error)` - Cleanup
  errors

### 📝 Commented Out Logs (Can Be Enabled)

All debug/info logs are commented out with multi-line comments. They can be
enabled by uncommenting.

#### Request Body Logging

```typescript
/* Commented out: Debug logging - uncomment to see request body
console.log('body', body);
*/
```

#### Environment Detection Logging

```typescript
/* Commented out: Environment detection logs - uncomment for debugging
console.log('Environment Detection:');
console.log('  - isVercel:', isVercel);
console.log('  - hasHuggingFaceKey:', !!huggingFaceApiKey);
console.log('  - requestedProvider:', requestedProvider || 'auto');
console.log('  - prompt length:', prompt.length, 'characters');
console.log('  - prompt preview:', prompt.substring(0, 100) + '...');
*/
```

#### Provider Selection Logging

```typescript
// Commented out: Provider selection log - uncomment to see which provider is used
// console.log(matchedProvider.log);
```

#### Generation Success Logging

```typescript
/* Commented out: Success logs - uncomment to see generation details
console.log('✅ Generation successful');
console.log('  - suggestion length:', result.length, 'characters');
console.log('  - suggestion preview:', result.substring(0, 100));
*/
```

#### HuggingFace Model Attempts

```typescript
/* Commented out: Model attempt logs - uncomment to see model fallback
console.log(`Attempting model ${i + 1}/${models.length}: ${modelName}`);
*/

/* Commented out: Response received log - uncomment to see API responses
console.log('Hugging Face response received');
*/

/* Commented out: Success log - uncomment to see successful generations
console.log(`✅ Successfully generated suggestion using model: ${modelName}`);
*/
```

#### Ollama Request Logging

```typescript
/* Commented out: Ollama request log - uncomment to see request details
console.log('Using Ollama for code completion:', JSON.stringify(requestBody, null, 2));
*/

/* Commented out: Ollama progress log - uncomment to see request status
console.log('🔄 Sending request to Ollama (may take 5-10 minutes)...');
*/

/* Commented out: Ollama response log - uncomment to see response status and elapsed time
const elapsed = Math.floor((Date.now() - startTime) / 1000);
console.log(`\r✅ Ollama response received in ${elapsed}s: ${response?.status} ${response?.statusText}`);
*/
```

## How to Enable Logs

### For Development Debugging

To enable all logs for debugging:

1. Search for `/* Commented out:` in the file
2. Remove the `/* */` comment blocks
3. For single-line comments, remove `//` prefix
4. Restart your development server

### For Specific Types of Logs

**See Request Details:**

```typescript
// Uncomment line 35-37 to see request body
console.log('body', body);
```

**See Environment Info:**

```typescript
// Uncomment lines 202-209 to see environment detection
```

**See Model Selection:**

```typescript
// Uncomment lines around 250 to see which provider/model is used
```

**See AI Generation:**

```typescript
// Uncomment lines around 264-266 to see generation results
```

## Current Behavior

### ✅ What You'll See (Active)

- All `console.error()` calls - critical errors always logged
- Production-ready error messages
- API failure notifications

### 🔇 What You Won't See (Commented)

- Request body content
- Environment variables
- Provider selection details
- Model attempt logs
- Success messages
- Generation details
- API response times

## Benefits

### Production Ready

- ✅ Clean console output
- ✅ Only error logs shown
- ✅ No sensitive data exposure
- ✅ Better performance

### Debug Ready

- ✅ Easy to enable specific logs
- ✅ Multi-line comments explain purpose
- ✅ Well-organized logging structure
- ✅ Selectively enable only needed logs

## Quick Enable All Logs

Replace all these patterns:

**From:**

```typescript
/* Commented out: [description]
console.log(...);
*/
```

**To:**

```typescript
console.log(...);
```

## Quick Disable All Logs

Replace all these patterns:

**From:**

```typescript
console.log(...);
```

**To:**

```typescript
/* console.log(...); */
```

## WebContainer Preview Logs

### Setup Flow Logs

```typescript
/* Commented out: WebContainer setup logs - uncomment to see detailed setup flow
console.group('🏗️ WebContainer Setup Flow');
console.log('1️⃣ Setup Check:', { hasInstance, isSetupComplete, ... });
*/
```

### Stop Server Logs

```typescript
/* Commented out: Stop server logs - uncomment to see stop flow
console.group('🛑 Stop Server Flow');
console.log('1️⃣ Stop Request:', { hasServerProcess, isSetupComplete });
*/
```

### Command Detection Logs

```typescript
/* Commented out: Start command detection logs - uncomment to see detection flow
console.group('🔍 Start Command Detection Flow');
console.log('1️⃣ Detection Started:', { hasInstance });
*/
```

### Step-by-Step Setup Logs

```typescript
/* console.log('4️⃣ 🔄 Step 1: Transforming template data'); */
/* console.log('5️⃣ 📁 Step 2: Mounting files to WebContainer'); */
/* console.log('6️⃣ 📦 Step 3: Installing dependencies'); */
/* console.log('8️⃣ 🚀 Step 4: Starting development server'); */
/* console.log('9️⃣ 🌐 Server ready event received:', { port, url }); */
/* console.log('🔟 ✅ SUCCESS: WebContainer setup completed'); */
```

## Recommendation

- **Development**: Enable specific logs as needed for debugging
- **Production**: Keep current setup - only error logs active
- **Testing**: Enable model attempt logs to see fallback behavior
