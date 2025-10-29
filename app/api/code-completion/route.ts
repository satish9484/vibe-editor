import { InferenceClient } from '@huggingface/inference';
import { type NextRequest, NextResponse } from 'next/server';

// Runtime configuration for Vercel and standalone
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes - compatible with Vercel hobby plan

interface CodeSuggestionRequest {
  fileContent: string;
  cursorLine: number;
  cursorColumn: number;
  suggestionType: string;
  fileName?: string;
  stream?: boolean; // Optional: enable streaming mode for real-time updates
  provider?: 'ollama' | 'huggingface'; // Optional: force a specific provider
}

interface CodeContext {
  language: string;
  framework: string;
  beforeContext: string;
  currentLine: string;
  afterContext: string;
  cursorPosition: { line: number; column: number };
  isInFunction: boolean;
  isInClass: boolean;
  isAfterComment: boolean;
  incompletePatterns: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: CodeSuggestionRequest = await request.json();

    /* Commented out: Debug logging - uncomment to see request body
    console.log('body', body);
    */

    const { fileContent, cursorLine, cursorColumn, suggestionType, fileName, stream, provider } = body;

    // Validate input
    if (!fileContent || cursorLine < 0 || cursorColumn < 0 || !suggestionType) {
      return NextResponse.json({ error: 'Invalid input parameters' }, { status: 400 });
    }

    const context = analyzeCodeContext(fileContent, cursorLine, cursorColumn, fileName);

    const prompt = buildPrompt(context, suggestionType);

    // Handle streaming mode
    if (stream) {
      return new Response(
        new ReadableStream({
          async start(controller) {
            try {
              const suggestion = await generateSuggestion(prompt, provider);
              const chunks = suggestion.split('');
              for (const chunk of chunks) {
                controller.enqueue(new TextEncoder().encode(chunk));
                await new Promise(resolve => setTimeout(resolve, 10)); // Small delay for streaming effect
              }
              controller.close();
            } catch (error) {
              controller.error(error);
            }
          },
        }),
        {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
        }
      );
    }

    const suggestion = await generateSuggestion(prompt, provider);
    console.log('suggestion', suggestion);

    return NextResponse.json({
      suggestion,
      context,
      metadata: {
        language: context.language,
        framework: context.framework,
        position: context.cursorPosition,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    console.error('❌ Context analysis error:', error);

    // Provide more specific error messages based on error type
    let errorMessage = 'Internal server error';
    let statusCode = 500;

    if (error instanceof Error) {
      // Enhanced error logging
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack?.substring(0, 300),
      });

      if (error.message?.includes('timed out')) {
        errorMessage = 'Request timed out. The AI service may be overloaded.';
        statusCode = 504;
      } else if (error.message?.includes('AI service error') || error.message?.includes('Hugging Face')) {
        errorMessage = 'AI service temporarily unavailable';
        statusCode = 503;
      } else if (error.message?.includes('fetch')) {
        errorMessage = 'Unable to connect to AI service';
        statusCode = 503;
      } else if (error.message?.includes('Invalid input')) {
        errorMessage = 'Invalid request parameters';
        statusCode = 400;
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        message: error instanceof Error ? error.message : 'Unknown error',
        type: 'api_error',
      },
      { status: statusCode }
    );
  }
}

function analyzeCodeContext(content: string, line: number, column: number, fileName?: string): CodeContext {
  const lines = content.split('\n');
  const currentLine = lines[line] || '';

  // Get surrounding context (10 lines before and after)
  const contextRadius = 10;
  const startLine = Math.max(0, line - contextRadius);
  const endLine = Math.min(lines.length, line + contextRadius);

  const beforeContext = lines.slice(startLine, line).join('\n');
  const afterContext = lines.slice(line + 1, endLine).join('\n');

  // Detect language and framework
  const language = detectLanguage(content, fileName);
  const framework = detectFramework(content);

  // Analyze code patterns
  const isInFunction = detectInFunction(lines, line);
  const isInClass = detectInClass(lines, line);
  const isAfterComment = detectAfterComment(currentLine, column);
  const incompletePatterns = detectIncompletePatterns(currentLine, column);

  return {
    language,
    framework,
    beforeContext,
    currentLine,
    afterContext,
    cursorPosition: { line, column },
    isInFunction,
    isInClass,
    isAfterComment,
    incompletePatterns,
  };
}

function buildPrompt(context: CodeContext, suggestionType: string): string {
  return `You are an expert code completion assistant. Generate a ${suggestionType} suggestion.

Language: ${context.language}
Framework: ${context.framework}

Context:
${context.beforeContext}
${context.currentLine.substring(0, context.cursorPosition.column)}|CURSOR|${context.currentLine.substring(context.cursorPosition.column)}
${context.afterContext}

Analysis:
- In Function: ${context.isInFunction}
- In Class: ${context.isInClass}
- After Comment: ${context.isAfterComment}
- Incomplete Patterns: ${context.incompletePatterns.join(', ') || 'None'}

Instructions:
1. Provide only the code that should be inserted at the cursor
2. Maintain proper indentation and style
3. Follow ${context.language} best practices
4. Make the suggestion contextually appropriate

Generate suggestion:`;
}

async function generateSuggestion(prompt: string, requestedProvider?: 'ollama' | 'huggingface'): Promise<string> {
  /* Commented out: Group logging - uncomment to see detailed generation flow
  console.group('🎯 generateSuggestion - Starting AI Generation');
  */
  try {
    // Check if we're running on Vercel (production) or local development
    const isVercel = Boolean(process.env.VERCEL);
    const huggingFaceApiKey = process.env.HUGGINGFACE_API_KEY;

    /* Commented out: Environment detection logs - uncomment for debugging
    console.log('Environment Detection:');
    console.log('  - isVercel:', isVercel);
    console.log('  - hasHuggingFaceKey:', !!huggingFaceApiKey);
    console.log('  - requestedProvider:', requestedProvider || 'auto');
    console.log('  - prompt length:', prompt.length, 'characters');
    console.log('  - prompt preview:', prompt.substring(0, 100) + '...');
    */

    // Validate HuggingFace API key if explicitly requested
    if (requestedProvider === 'huggingface' && !huggingFaceApiKey) {
      throw new Error('HUGGINGFACE_API_KEY is not available. Please set it in your environment variables.');
    }

    let result: string;

    // Provider configuration for more maintainable selection
    const providerMatrix: {
      match: () => boolean;
      action: () => Promise<string>;
      log: string;
    }[] = [
      {
        match: () => requestedProvider === 'huggingface' && !!huggingFaceApiKey,
        action: async () => await generateWithHuggingFace(prompt, huggingFaceApiKey!),
        log: '🔵 Using HuggingFace API (Requested)',
      },
      {
        match: () => requestedProvider === 'ollama',
        action: async () => await generateWithOllama(prompt),
        log: '🟢 Using Ollama API (Requested)',
      },
      {
        match: () => !!huggingFaceApiKey, // Prefer HuggingFace if available (works everywhere)
        action: async () => await generateWithHuggingFace(prompt, huggingFaceApiKey!),
        log: '🔵 Using HuggingFace API (Available)',
      },
      {
        match: () => !isVercel,
        action: async () => await generateWithOllama(prompt),
        log: '🟢 Using Ollama API (Fallback)',
      },
    ];

    const matchedProvider = providerMatrix.find(p => p.match());

    if (matchedProvider) {
      // Commented out: Provider selection log - uncomment to see which provider is used
      // console.log(matchedProvider.log);
      result = await matchedProvider.action();
    } else {
      console.error('❌ No AI service available');

      // Provide helpful error message based on environment
      if (isVercel) {
        throw new Error('HUGGINGFACE_API_KEY is not set. Please configure it in Vercel environment variables.');
      } else {
        throw new Error('No AI service available. Please set either HUGGINGFACE_API_KEY or ensure Ollama is running.');
      }
    }

    /* Commented out: Success logs - uncomment to see generation details
    console.log('✅ Generation successful');
    console.log('  - suggestion length:', result.length, 'characters');
    console.log('  - suggestion preview:', result.substring(0, 100));
    */
    /* Commented out: Group end - uncomment with group start
    console.groupEnd();
    */
    return result;
  } catch (error: unknown) {
    console.error('❌ AI generation error:', error);

    // Provide more specific error messages for different error types
    let errorMsg: string;
    if (error instanceof TypeError && error.message.includes('fetch')) {
      errorMsg = 'Unable to connect to AI service. Please check your network connection.';
    } else if (error instanceof Error && error.message?.includes('AI model not found')) {
      errorMsg = 'AI model not found. Please check if the model is installed.';
    } else if (error instanceof Error && error.message?.includes('HUGGINGFACE_API_KEY')) {
      // Preserve specific API key error messages
      errorMsg = error.message;
    } else if (error instanceof Error && error.message?.includes('AI service')) {
      errorMsg = error.message; // Re-throw AI-specific errors
    } else {
      errorMsg = 'AI suggestion generation failed. Please try again.';
    }

    console.error('Final error message:', errorMsg);
    /* Commented out: Group end - uncomment with group start
    console.groupEnd();
    */
    throw new Error(errorMsg);
  }
}

async function generateWithHuggingFace(prompt: string, apiKey: string): Promise<string> {
  try {
    /* Commented out: HuggingFace initialization log - uncomment to see API calls
    console.log('Using HuggingFace InferenceClient for code completion');
    */

    // Initialize HuggingFace Inference client
    const client = new InferenceClient(apiKey);

    // List of models that support text generation
    const models = [
      'deepseek-ai/DeepSeek-V3-0324', // New DeepSeek V3 model (excellent performance)
      'bigcode/starcoder2-15b', // Best all-rounder (15B params)
      'bigcode/starcoder2-7b', // Faster 7B version
      'bigcode/starcoder2-3b', // Smallest & fastest 3B version
      'bigcode/starcoder', // Original StarCoder
      'Salesforce/codegen-350M-mono', // Small reliable model
    ];

    // Try models in order until one works
    let lastError: Error | null = null;

    for (let i = 0; i < models.length; i++) {
      const modelName = models[i];
      /* Commented out: Model attempt logs - uncomment to see model fallback
      console.log(`Attempting model ${i + 1}/${models.length}: ${modelName}`);
      */

      try {
        // Use chatCompletion API (more reliable and modern)
        const chatCompletion = await client.chatCompletion({
          model: modelName,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 150,
          temperature: 0.7,
          top_p: 0.9,
        });

        /* Commented out: Response received log - uncomment to see API responses
        console.log('Hugging Face response received');
        */

        // Extract generated text from response
        let suggestion = '';
        if (chatCompletion.choices && chatCompletion.choices.length > 0) {
          const message = chatCompletion.choices[0].message;
          if (message && message.content) {
            suggestion = message.content;
          }
        }

        // If no suggestion found, try next model or return placeholder
        if (!suggestion || suggestion.trim().length === 0) {
          if (i < models.length - 1) {
            /* Commented out: Fallback logs - uncomment to see model switching
            console.warn(`Model ${modelName} returned empty response, trying next...`);
            */
            lastError = new Error(`Model ${modelName} returned empty response`);
            continue;
          }
          /* Commented out: Placeholder log - uncomment to see when placeholders are returned
          console.warn('No valid suggestion from any model, returning placeholder');
          */
          return '// Add your code here';
        }

        // Clean up the suggestion - remove the original prompt if present
        suggestion = suggestion.replace(prompt, '').trim();

        // Remove code blocks if present
        if (suggestion.includes('```')) {
          const codeMatch = suggestion.match(/```[\w]*\n?([\s\S]*?)```/);
          suggestion = codeMatch ? codeMatch[1].trim() : suggestion;
        }

        /* Commented out: Success log - uncomment to see successful generations
        console.log(`✅ Successfully generated suggestion using model: ${modelName}`);
        */
        return suggestion.trim();
      } catch (error) {
        /* Commented out: Model failure log - ERROR logs are still active
        console.error(`Model ${modelName} failed:`, error);
        */

        if (i < models.length - 1) {
          /* Commented out: Fallback attempt log - uncomment to see model retries
          console.warn(`Trying next model...`);
          */
          lastError = error instanceof Error ? error : new Error(String(error));
          continue;
        }
        throw error;
      }
    }

    // If we get here, all models failed
    if (lastError) {
      throw new Error(`All models failed. Last error: ${lastError.message}`);
    }
    throw new Error('No models available to use.');
  } catch (error) {
    /* ERROR LOG - Always active for debugging
    console.error('Hugging Face generation error:', error);
    */
    console.error('Hugging Face generation error:', error);
    throw new Error(`Hugging Face API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function generateWithOllama(prompt: string): Promise<string> {
  try {
    // Prefer localhost for local development, fall back to Docker hostname
    const ollamaUrl = process.env.OLLAMA_HOST || 'http://localhost:11434';
    const requestBody = {
      // Current working model (lightweight, ~637MB)
      model: 'tinyllama',

      // Alternative models (uncomment to use):
      // model: 'codellama:latest',     // Full CodeLlama (3.8GB) - requires 6GB+ RAM
      // model: 'codellama:7b',         // CodeLlama 7B (3.8GB) - requires 6GB+ RAM
      // model: 'codellama:13b',       // CodeLlama 13B (7.3GB) - requires 8GB+ RAM
      // model: 'codellama:34b',       // CodeLlama 34B (19GB) - requires 20GB+ RAM

      prompt,
      stream: false,
      option: {
        temperature: 0.7,
        max_tokens: 300,
      },
    };

    /* Commented out: Ollama request log - uncomment to see request details
    console.log('Using Ollama for code completion:', JSON.stringify(requestBody, null, 2));
    */

    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10 * 60 * 1000); // 10 minute timeout

    /* Commented out: Ollama progress log - uncomment to see request status
    console.log('🔄 Sending request to Ollama (may take 5-10 minutes)...');
    */
    const startTime = Date.now();

    // Start progress tracking
    const progressInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      process.stdout.write(`\r⏳ Waiting for Ollama response... [${minutes}:${seconds.toString().padStart(2, '0')}]`);
    }, 1000); // Update every second

    let response;
    try {
      response = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
    } finally {
      clearInterval(progressInterval);
      clearTimeout(timeoutId);
      /* Commented out: Ollama response log - uncomment to see response status and elapsed time
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      console.log(`\r✅ Ollama response received in ${elapsed}s: ${response?.status} ${response?.statusText}`);
      */
    }

    if (!response) {
      throw new Error('No response received from Ollama');
    }

    if (!response.ok) {
      const errorText = await response.text();
      /* ERROR LOG - Always active for debugging
      console.error('Ollama error response:', errorText);
      */
      console.error('Ollama error response:', errorText);

      // Provide more specific error messages based on OLLAMA response
      let errorMessage = `AI service error: ${response.statusText}`;
      if (response.status === 404) {
        errorMessage = 'AI model not found. Please check if the model is installed.';
      } else if (response.status === 500) {
        errorMessage = 'AI service internal error. The model may be overloaded.';
      } else if (response.status === 503) {
        errorMessage = 'AI service temporarily unavailable. Please try again later.';
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();
    let suggestion = data.response;

    // Clean up the suggestion
    if (suggestion.includes('```')) {
      const codeMatch = suggestion.match(/```[\w]*\n?([\s\S]*?)```/);
      suggestion = codeMatch ? codeMatch[1].trim() : suggestion;
    }

    return suggestion;
  } catch (error) {
    /* ERROR LOG - Always active for debugging
    console.error('Ollama generation error:', error);
    */
    console.error('Ollama generation error:', error);

    // Handle specific timeout errors
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Ollama request timed out after 10 minutes. The model may be slow or overloaded.');
    }

    throw new Error(`Ollama API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper functions for code analysis
function detectLanguage(content: string, fileName?: string): string {
  if (fileName) {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const extMap: Record<string, string> = {
      ts: 'TypeScript',
      tsx: 'TypeScript',
      js: 'JavaScript',
      jsx: 'JavaScript',
      py: 'Python',
      java: 'Java',
      go: 'Go',
      rs: 'Rust',
      php: 'PHP',
    };
    if (ext && extMap[ext]) return extMap[ext];
  }

  // Content-based detection
  if (content.includes('interface ') || content.includes(': string')) return 'TypeScript';
  if (content.includes('def ') || content.includes('import ')) return 'Python';
  if (content.includes('func ') || content.includes('package ')) return 'Go';

  return 'JavaScript';
}

function detectFramework(content: string): string {
  if (content.includes('import React') || content.includes('useState')) return 'React';
  if (content.includes('import Vue') || content.includes('<template>')) return 'Vue';
  if (content.includes('@angular/') || content.includes('@Component')) return 'Angular';
  if (content.includes('next/') || content.includes('getServerSideProps')) return 'Next.js';

  return 'None';
}

function detectInFunction(lines: string[], currentLine: number): boolean {
  for (let i = currentLine - 1; i >= 0; i--) {
    const line = lines[i];
    if (line?.match(/^\s*(function|def|const\s+\w+\s*=|let\s+\w+\s*=)/)) return true;
    if (line?.match(/^\s*}/)) break;
  }
  return false;
}

function detectInClass(lines: string[], currentLine: number): boolean {
  for (let i = currentLine - 1; i >= 0; i--) {
    const line = lines[i];
    if (line?.match(/^\s*(class|interface)\s+/)) return true;
  }
  return false;
}

function detectAfterComment(line: string, column: number): boolean {
  const beforeCursor = line.substring(0, column);
  return /\/\/.*$/.test(beforeCursor) || /#.*$/.test(beforeCursor);
}

function detectIncompletePatterns(line: string, column: number): string[] {
  const beforeCursor = line.substring(0, column);
  const patterns: string[] = [];

  if (/^\s*(if|while|for)\s*\($/.test(beforeCursor.trim())) patterns.push('conditional');
  if (/^\s*(function|def)\s*$/.test(beforeCursor.trim())) patterns.push('function');
  if (/\{\s*$/.test(beforeCursor)) patterns.push('object');
  if (/\[\s*$/.test(beforeCursor)) patterns.push('array');
  if (/=\s*$/.test(beforeCursor)) patterns.push('assignment');
  if (/\.\s*$/.test(beforeCursor)) patterns.push('method-call');

  return patterns;
}
