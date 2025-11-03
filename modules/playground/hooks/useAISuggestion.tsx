import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

// Toggle for the AI Suggestion Request Flow group logs
const AI_REQUEST_GROUP_LOG = false;

interface AISuggestionsState {
  suggestion: string | null;
  isLoading: boolean;
  position: { line: number; column: number } | null;
  decoration: string[];
  isEnabled: boolean;
}

interface UseAISuggestionsReturn extends AISuggestionsState {
  toggleEnabled: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetchSuggestion: (type: string, editor: any) => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  acceptSuggestion: (editor: any, monaco: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rejectSuggestion: (editor: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  clearSuggestion: (editor: any) => void;
}

export const useAISuggestions = (): UseAISuggestionsReturn => {
  const [state, setState] = useState<AISuggestionsState>({
    suggestion: null,
    isLoading: false,
    position: null,
    decoration: [],
    isEnabled: true,
  });

  // Concurrency control (latest-wins only)
  const latestRequestIdRef = useRef(0);

  const toggleEnabled = useCallback(() => {
    setState(prev => ({ ...prev, isEnabled: !prev.isEnabled }));
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fetchSuggestion = useCallback(async (type: string, editor: any) => {
    setState(currentState => {
      // Guard: optionally require app readiness before requesting AI
      // const appReady = typeof window !== 'undefined' && (window as any).__APP_READY === true;
      const appReady = typeof window !== 'undefined'; // Allow AI without WebContainer for Vercel
      if (!appReady) {
        // Soft notice just once per session could be added if needed
        return currentState;
      }

      if (!currentState.isEnabled) {
        return currentState;
      }

      if (!editor) {
        return currentState;
      }

      const model = editor.getModel();
      const cursorPosition = editor.getPosition();

      if (!model || !cursorPosition) {
        return currentState;
      }

      const newState = { ...currentState, isLoading: true };

      (async () => {
        if (AI_REQUEST_GROUP_LOG) console.group('🤖 AI Suggestion Request Flow');
        // Track latest request id to ignore stale responses (declare outside try for catch access)
        const requestId = ++latestRequestIdRef.current;
        try {
          const payload = {
            fileContent: model.getValue(),
            cursorLine: cursorPosition.lineNumber - 1,
            cursorColumn: cursorPosition.column - 1,
            suggestionType: type,
            stream: false,
            provider: 'huggingface',
          };

          console.log('1️⃣ Request Payload:', {
            fileContentLength: payload.fileContent.length,
            cursorPosition: `${payload.cursorLine + 1}:${payload.cursorColumn + 1}`,
            suggestionType: payload.suggestionType,
            fileContentPreview: payload.fileContent.substring(0, 100) + '...',
          });

          const response = await fetch('/api/code-completion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          console.log('2️⃣ API Response Status:', {
            status: response.status,
            ok: response.ok,
            statusText: response.statusText,
          });

          if (!response.ok) {
            console.error('2️⃣ ❌ API Error:', response);
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error || `API responded with status ${response.status}`;

            // Show specific error toast based on error type
            if (response.status === 503) {
              toast.error('AI Service Unavailable', {
                description: 'The AI service is temporarily unavailable. Please try again later.',
                duration: 5000,
              });
            } else if (response.status === 404) {
              toast.error('AI Model Not Found', {
                description: 'The AI model is not installed. Please contact support.',
                duration: 5000,
              });
            } else if (response.status >= 500) {
              toast.error('AI Service Error', {
                description: 'The AI service encountered an error. Please try again.',
                duration: 4000,
              });
            } else {
              toast.error('Request Failed', {
                description: errorMessage,
                duration: 4000,
              });
            }

            throw new Error(errorMessage);
          }

          const data = await response.json();

          // Ignore if this response is from an outdated request
          if (requestId !== latestRequestIdRef.current) {
            console.log('⏭️ Stale response ignored (newer request exists)');
            if (AI_REQUEST_GROUP_LOG) console.groupEnd();
            return;
          }

          console.log('3️⃣ API Response Data:', {
            hasSuggestion: !!data.suggestion,
            suggestionLength: data.suggestion ? data.suggestion.length : 0,
            suggestionPreview: data.suggestion ? data.suggestion.substring(0, 50) + '...' : null,
          });

          if (data.suggestion) {
            const suggestionText = data.suggestion.trim();

            console.log('4️⃣ ✅ SUCCESS: Setting suggestion state', {
              suggestionLength: suggestionText.length,
              position: `${cursorPosition.lineNumber}:${cursorPosition.column}`,
            });

            // Show success toast with clear instructions
            toast.success('AI Suggestion Generated', {
              description: 'Press Tab to accept • Press Escape to reject',
              duration: 5000,
            });

            setState(prev => ({
              ...prev,
              suggestion: suggestionText,
              position: {
                line: cursorPosition.lineNumber,
                column: cursorPosition.column,
              },
              isLoading: false,
            }));
          } else {
            console.warn('4️⃣ ⚠️ WARNING: No suggestion received from API.');
            toast.warning('No Suggestion Available', {
              description: 'The AI could not generate a suggestion for this context.',
              duration: 3000,
            });
            // Ensure only latest request clears loading
            if (requestId === latestRequestIdRef.current) {
              setState(prev => ({ ...prev, isLoading: false }));
            }
          }
        } catch (error: unknown) {
          console.error('❌ ERROR: Error fetching code suggestion:', error);
          // Show error toast for network/connection issues
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

          if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
            toast.error('Connection Error', {
              description: 'Unable to connect to the AI service. Please check your internet connection.',
              duration: 5000,
            });
          } else if (errorMessage.includes('AI service')) {
            toast.error('AI Service Error', {
              description: errorMessage,
              duration: 5000,
            });
          } else {
            toast.error('Suggestion Failed', {
              description: 'Failed to generate AI suggestion. Please try again.',
              duration: 4000,
            });
          }
          if (requestId === latestRequestIdRef.current) {
            setState(prev => ({ ...prev, isLoading: false }));
          }
        }
        if (AI_REQUEST_GROUP_LOG) console.groupEnd();
      })();

      return newState;
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {};
  }, []);

  const acceptSuggestion = useCallback(
    (editor: any, monaco: any) => {
      setState(currentState => {
        if (!currentState.suggestion || !currentState.position || !editor || !monaco) {
          return currentState;
        }

        const { line, column } = currentState.position;
        const sanitizedSuggestion = currentState.suggestion.replace(/^\d+:\s*/gm, '');

        editor.executeEdits('', [
          {
            range: new monaco.Range(line, column, line, column),
            text: sanitizedSuggestion,
            forceMoveMarkers: true,
          },
        ]);

        if (editor && currentState.decoration.length > 0) {
          editor.deltaDecorations(currentState.decoration, []);
        }

        return {
          ...currentState,
          suggestion: null,
          position: null,
          decoration: [],
        };
      });
    },
    [setState]
  );

  const rejectSuggestion = useCallback(
    (editor: any) => {
      setState(currentState => {
        if (editor && currentState.decoration.length > 0) {
          editor.deltaDecorations(currentState.decoration, []);
        }

        return {
          ...currentState,
          suggestion: null,
          position: null,
          decoration: [],
        };
      });
    },
    [setState]
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clearSuggestion = useCallback((editor: any) => {
    setState(currentState => {
      if (editor && currentState.decoration.length > 0) {
        editor.deltaDecorations(currentState.decoration, []);
      }
      return {
        ...currentState,
        suggestion: null,
        position: null,
        decoration: [],
      };
    });
  }, []);

  return {
    ...state,
    toggleEnabled,
    fetchSuggestion,
    acceptSuggestion,
    rejectSuggestion,
    clearSuggestion,
  };
};
