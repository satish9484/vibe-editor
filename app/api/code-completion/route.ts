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

    console.log('body', body);

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
    console.error('Context analysis error:', error);

    // Provide more specific error messages based on error type
    let errorMessage = 'Internal server error';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message?.includes('timed out')) {
        errorMessage = 'Request timed out. The AI service may be overloaded.';
        statusCode = 504;
      } else if (error.message?.includes('AI service error')) {
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
  console.group('🎯 generateSuggestion - Starting AI Generation');
  try {
    // Check if we're running on Vercel (production) or local development
    const isVercel = Boolean(process.env.VERCEL);
    const huggingFaceApiKey = process.env.HUGGINGFACE_API_KEY;

    console.log('Environment Detection:');
    console.log('  - isVercel:', isVercel);
    console.log('  - hasHuggingFaceKey:', !!huggingFaceApiKey);
    console.log('  - requestedProvider:', requestedProvider || 'auto');
    console.log('  - prompt length:', prompt.length, 'characters');
    console.log('  - prompt preview:', prompt.substring(0, 100) + '...');

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
        match: () => isVercel && !!huggingFaceApiKey,
        action: async () => await generateWithHuggingFace(prompt, huggingFaceApiKey!),
        log: '🔵 Using HuggingFace API (Vercel)',
      },
      {
        match: () => !isVercel,
        action: async () => await generateWithOllama(prompt),
        log: '🟢 Using Ollama API (Local - Default)',
      },
    ];

    const matchedProvider = providerMatrix.find(p => p.match());

    if (matchedProvider) {
      console.log(matchedProvider.log);
      result = await matchedProvider.action();
    } else {
      console.warn('⚠️ No AI service available - returning empty suggestion');
      result = '';
    }

    console.log('✅ Generation successful');
    console.log('  - suggestion length:', result.length, 'characters');
    console.log('  - suggestion preview:', result.substring(0, 100));
    console.groupEnd();
    return result;
  } catch (error: unknown) {
    console.error('❌ AI generation error:', error);

    // Provide more specific error messages for different error types
    let errorMsg: string;
    if (error instanceof TypeError && error.message.includes('fetch')) {
      errorMsg = 'Unable to connect to AI service. Please check your network connection.';
    } else if (error instanceof Error && error.message?.includes('AI model not found')) {
      errorMsg = 'AI model not found. Please check if the model is installed.';
    } else if (error instanceof Error && error.message?.includes('AI service')) {
      errorMsg = error.message; // Re-throw AI-specific errors
    } else {
      errorMsg = 'AI suggestion generation failed. Please try again.';
    }

    console.error('Final error message:', errorMsg);
    console.groupEnd();
    throw new Error(errorMsg);
  }
}

async function generateWithHuggingFace(prompt: string, apiKey: string): Promise<string> {
  try {
    console.log('Using Hugging Face API for code completion');

    const response = await fetch('https://api-inference.huggingface.co/models/microsoft/CodeBERT-base', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_length: 300,
          temperature: 0.7,
          do_sample: true,
          top_p: 0.9,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hugging Face error response:', errorText);

      let errorMessage = `Hugging Face API error: ${response.statusText}`;
      if (response.status === 401) {
        errorMessage = 'Invalid Hugging Face API key. Please check your credentials.';
      } else if (response.status === 429) {
        errorMessage = 'Hugging Face API rate limit exceeded. Please try again later.';
      } else if (response.status === 503) {
        errorMessage = 'Hugging Face model is loading. Please try again in a moment.';
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();

    // Handle different response formats from Hugging Face
    let suggestion = '';
    if (Array.isArray(data) && data.length > 0) {
      suggestion = data[0].generated_text || data[0].text || '';
    } else if (typeof data === 'string') {
      suggestion = data;
    } else if (data.generated_text) {
      suggestion = data.generated_text;
    }

    // Clean up the suggestion
    if (suggestion.includes('```')) {
      const codeMatch = suggestion.match(/```[\w]*\n?([\s\S]*?)```/);
      suggestion = codeMatch ? codeMatch[1].trim() : suggestion;
    }

    return suggestion.trim();
  } catch (error) {
    console.error('Hugging Face generation error:', error);
    throw new Error(`Hugging Face API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function generateWithOllama(prompt: string): Promise<string> {
  try {
    const ollamaUrl = process.env.OLLAMA_HOST || 'http://ollama:11434';
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

    console.log('Using Ollama for code completion:', JSON.stringify(requestBody, null, 2));

    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10 * 60 * 1000); // 10 minute timeout

    console.log('🔄 Sending request to Ollama (may take 5-10 minutes)...');
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
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      console.log(`\r✅ Ollama response received in ${elapsed}s: ${response?.status} ${response?.statusText}`);
    }

    if (!response) {
      throw new Error('No response received from Ollama');
    }

    if (!response.ok) {
      const errorText = await response.text();
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
