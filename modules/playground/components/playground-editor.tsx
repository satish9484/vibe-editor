'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import Editor, { type Monaco } from '@monaco-editor/react';
import { useCallback, useEffect, useRef } from 'react';
import { configureMonaco, defaultEditorOptions, getEditorLanguage } from '../lib/editor-config';
import { TemplateFile } from '../lib/path-to-json';
import { useSuggestionWidget } from './suggestion-widget';

// Type definitions for Monaco Editor
type MonacoEditor = any; // Monaco editor instance
type MonacoCompletionProvider = any; // Monaco completion provider
type MonacoCommand = any; // Monaco command

interface PlaygroundEditorProps {
  activeFile: TemplateFile | undefined;
  content: string;
  onContentChange: (value: string) => void;
  suggestion: string | null;
  suggestionLoading: boolean;
  suggestionPosition: { line: number; column: number } | null;
  onAcceptSuggestion: (editor: any, monaco: Monaco) => void;
  onRejectSuggestion: (editor: any) => void;
  onTriggerSuggestion: (type: string, editor: any) => void;
}

export const PlaygroundEditor = ({
  activeFile,
  content,
  onContentChange,
  suggestion,
  suggestionLoading,
  suggestionPosition,
  onAcceptSuggestion,
  onRejectSuggestion,
  onTriggerSuggestion,
}: PlaygroundEditorProps) => {
  const editorRef = useRef<MonacoEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const inlineCompletionProviderRef = useRef<MonacoCompletionProvider | null>(null);
  const currentSuggestionRef = useRef<{
    text: string;
    position: { line: number; column: number };
    id: string;
  } | null>(null);
  const isAcceptingSuggestionRef = useRef(false);
  const suggestionAcceptedRef = useRef(false);
  const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tabCommandRef = useRef<MonacoCommand | null>(null);

  // Generate unique ID for each suggestion
  const generateSuggestionId = () => `suggestion-${Date.now()}-${Math.random()}`;

  // Create inline completion provider
  const createInlineCompletionProvider = useCallback(
    (monaco: Monaco) => {
      return {
        provideInlineCompletions: async (model: any, position: any, context: any, token: any) => {
          // console.group('🔍 AI Suggestion Flow - provideInlineCompletions');
          // console.log('1️⃣ Initial State Check:', {
          //   hasSuggestion: !!suggestion,
          //   hasPosition: !!suggestionPosition,
          //   currentPos: `${position.lineNumber}:${position.column}`,
          //   suggestionPos: suggestionPosition ? `${suggestionPosition.line}:${suggestionPosition.column}` : null,
          //   isAccepting: isAcceptingSuggestionRef.current,
          //   suggestionAccepted: suggestionAcceptedRef.current,
          // });

          // Don't provide completions if we're currently accepting or have already accepted
          if (isAcceptingSuggestionRef.current || suggestionAcceptedRef.current) {
            // console.log('2️⃣ ❌ BLOCKED: Already accepting or accepted suggestion');
            // console.groupEnd();
            return { items: [] };
          }

          // Only provide suggestion if we have one
          if (!suggestion || !suggestionPosition) {
            // console.log('2️⃣ ❌ BLOCKED: No suggestion or position available');
            // console.groupEnd();
            return { items: [] };
          }

          // Check if current position matches suggestion position (with some tolerance)
          const currentLine = position.lineNumber;
          const currentColumn = position.column;

          const isPositionMatch =
            currentLine === suggestionPosition.line && currentColumn >= suggestionPosition.column && currentColumn <= suggestionPosition.column + 10; // Increased tolerance for better UX

          if (!isPositionMatch) {
            // console.log('2️⃣ ❌ BLOCKED: Position mismatch', {
            //   current: `${currentLine}:${currentColumn}`,
            //   expected: `${suggestionPosition.line}:${suggestionPosition.column}`,
            //   tolerance: '±10 characters',
            // });
            // console.groupEnd();
            return { items: [] };
          }

          const suggestionId = generateSuggestionId();
          currentSuggestionRef.current = {
            text: suggestion,
            position: suggestionPosition,
            id: suggestionId,
          };

          // console.log('2️⃣ ✅ PROCEEDING: Creating suggestion', {
          //   suggestionId,
          //   suggestion: suggestion.substring(0, 50) + '...',
          //   position: suggestionPosition,
          // });

          // Clean the suggestion text (remove \r characters)
          const cleanSuggestion = suggestion.replace(/\r/g, '');
          // console.log('3️⃣ ✅ SUCCESS: Providing inline completion');
          // console.groupEnd();

          return {
            items: [
              {
                insertText: cleanSuggestion,
                range: new monaco.Range(suggestionPosition.line, suggestionPosition.column, suggestionPosition.line, suggestionPosition.column),
                kind: monaco.languages.CompletionItemKind.Snippet,
                label: 'AI Suggestion',
                detail: 'AI-generated code suggestion',
                documentation: 'Press Tab to accept',
                sortText: '0000', // High priority
                filterText: '',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              },
            ],
          };
        },
        freeInlineCompletions: (completions: any) => {
          // console.log('🧹 freeInlineCompletions called - cleaning up');
        },
      };
    },
    [suggestion, suggestionPosition]
  );

  // Clear current suggestion
  const clearCurrentSuggestion = useCallback(() => {
    // console.log('Clearing current suggestion');
    currentSuggestionRef.current = null;
    suggestionAcceptedRef.current = false;
    if (editorRef.current) {
      editorRef.current.trigger('ai', 'editor.action.inlineSuggest.hide', null);
    }
  }, []);

  // Clear stale suggestions after a delay
  const clearStaleSuggestion = useCallback(() => {
    if (currentSuggestionRef.current && !suggestionAcceptedRef.current) {
      const now = Date.now();
      const suggestionAge = now - parseInt(currentSuggestionRef.current.id.split('-')[1]);

      // Clear suggestions older than 5 seconds
      if (suggestionAge > 30000) {
        // console.log('Clearing stale suggestion (older than 30 seconds)');
        clearCurrentSuggestion();
      }
    }
  }, [clearCurrentSuggestion]);

  // Accept current suggestion with double-acceptance prevention
  const acceptCurrentSuggestion = useCallback(() => {
    // console.group('✅ AI Suggestion Acceptance Flow');
    // console.log('1️⃣ Initial State Check:', {
    //   hasEditor: !!editorRef.current,
    //   hasMonaco: !!monacoRef.current,
    //   hasSuggestion: !!currentSuggestionRef.current,
    //   isAccepting: isAcceptingSuggestionRef.current,
    //   suggestionAccepted: suggestionAcceptedRef.current,
    // });

    if (!editorRef.current || !monacoRef.current || !currentSuggestionRef.current) {
      // console.log('2️⃣ ❌ BLOCKED: Cannot accept suggestion - missing refs');
      // console.groupEnd();
      return false;
    }

    // CRITICAL: Prevent double acceptance with immediate flag setting
    if (isAcceptingSuggestionRef.current || suggestionAcceptedRef.current) {
      // console.log('2️⃣ ❌ BLOCKED: Already accepting/accepted suggestion, skipping');
      // console.groupEnd();
      return false;
    }

    // Set flags IMMEDIATELY to prevent any race conditions
    isAcceptingSuggestionRef.current = true;
    suggestionAcceptedRef.current = true;
    // console.log('2️⃣ ✅ PROCEEDING: Setting acceptance flags');

    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const currentSuggestion = currentSuggestionRef.current;

    try {
      // Clean the suggestion text (remove \r characters)
      const cleanSuggestionText = currentSuggestion.text.replace(/\r/g, '');
      // console.log('3️⃣ Processing suggestion:', {
      //   originalLength: currentSuggestion.text.length,
      //   cleanLength: cleanSuggestionText.length,
      //   preview: cleanSuggestionText.substring(0, 50) + '...',
      // });

      // Get current cursor position to validate
      const currentPosition = editor.getPosition();
      const suggestionPos = currentSuggestion.position;
      // console.log('4️⃣ Position validation:', {
      //   currentPosition: `${currentPosition.lineNumber}:${currentPosition.column}`,
      //   suggestionPosition: `${suggestionPos.line}:${suggestionPos.column}`,
      //   tolerance: '±5 characters',
      // });

      // Verify we're still at the suggestion position
      if (
        currentPosition.lineNumber !== suggestionPos.line ||
        currentPosition.column < suggestionPos.column ||
        currentPosition.column > suggestionPos.column + 5
      ) {
        // console.log('4️⃣ ❌ BLOCKED: Position changed, cannot accept suggestion');
        // console.groupEnd();
        return false;
      }

      // Insert the suggestion text at the correct position
      const range = new monaco.Range(suggestionPos.line, suggestionPos.column, suggestionPos.line, suggestionPos.column);
      // console.log('5️⃣ Executing edit:', {
      //   range: `${suggestionPos.line}:${suggestionPos.column}`,
      //   textLength: cleanSuggestionText.length,
      // });

      // Use executeEdits to insert the text
      const success = editor.executeEdits('ai-suggestion-accept', [
        {
          range: range,
          text: cleanSuggestionText,
          forceMoveMarkers: true,
        },
      ]);

      if (!success) {
        console.error('5️⃣ ❌ FAILED: Failed to execute edit');
        // console.groupEnd();
        return false;
      }

      // Calculate new cursor position
      const lines = cleanSuggestionText.split('\n');
      const endLine = suggestionPos.line + lines.length - 1;
      const endColumn = lines.length === 1 ? suggestionPos.column + cleanSuggestionText.length : lines[lines.length - 1].length + 1;

      // Move cursor to end of inserted text
      editor.setPosition({ lineNumber: endLine, column: endColumn });
      // console.log('6️⃣ ✅ SUCCESS: Suggestion accepted', {
      //   newPosition: `${endLine}:${endColumn}`,
      //   linesAdded: lines.length,
      // });

      // Clear the suggestion
      clearCurrentSuggestion();

      // Call the parent's accept handler
      onAcceptSuggestion(editor, monaco);
      // console.groupEnd();
      return true;
    } catch (error) {
      console.error('❌ ERROR: Error accepting suggestion:', error);
      // console.groupEnd();
      return false;
    } finally {
      // Reset accepting flag immediately
      isAcceptingSuggestionRef.current = false;

      // Keep accepted flag for longer to prevent immediate re-acceptance
      setTimeout(() => {
        suggestionAcceptedRef.current = false;
        // console.log('🔄 Reset suggestionAcceptedRef flag after 1 second');
      }, 1000); // Increased delay to 1 second
    }
  }, [clearCurrentSuggestion, onAcceptSuggestion]);

  // Check if there's an active inline suggestion at current position
  const hasActiveSuggestionAtPosition = useCallback(() => {
    if (!editorRef.current || !currentSuggestionRef.current) return false;

    const position = editorRef.current.getPosition();
    const suggestion = currentSuggestionRef.current;

    return (
      position.lineNumber === suggestion.position.line &&
      position.column >= suggestion.position.column &&
      position.column <= suggestion.position.column + 2
    );
  }, []);

  // Update inline completions when suggestion changes
  useEffect(() => {
    // console.group('🔄 Suggestion Change Effect');
    // console.log('1️⃣ Effect Triggered:', {
    //   hasSuggestion: !!suggestion,
    //   hasPosition: !!suggestionPosition,
    //   suggestionPreview: suggestion ? suggestion.substring(0, 30) + '...' : null,
    //   position: suggestionPosition,
    //   isAccepting: isAcceptingSuggestionRef.current,
    //   suggestionAccepted: suggestionAcceptedRef.current,
    // });

    if (!editorRef.current || !monacoRef.current) {
      // console.log('2️⃣ ❌ BLOCKED: No editor or monaco refs available');
      // console.groupEnd();
      return;
    }

    const editor = editorRef.current;
    const monaco = monacoRef.current;

    // Don't update if we're in the middle of accepting a suggestion
    if (isAcceptingSuggestionRef.current || suggestionAcceptedRef.current) {
      // console.log('2️⃣ ❌ BLOCKED: Skipping update - currently accepting/accepted suggestion');
      // console.groupEnd();
      return;
    }

    // Dispose previous provider
    if (inlineCompletionProviderRef.current) {
      // console.log('2️⃣ 🧹 CLEANUP: Disposing previous provider');
      inlineCompletionProviderRef.current.dispose();
      inlineCompletionProviderRef.current = null;
    }

    // Clear current suggestion reference
    currentSuggestionRef.current = null;
    // console.log('2️⃣ 🧹 CLEANUP: Cleared current suggestion reference');

    // Register new provider if we have a suggestion
    if (suggestion && suggestionPosition) {
      // console.log('2️⃣ ✅ PROCEEDING: Registering new inline completion provider', {
      //   language: getEditorLanguage(activeFile?.fileExtension || ''),
      //   suggestionLength: suggestion.length,
      // });

      const language = getEditorLanguage(activeFile?.fileExtension || '');
      const provider = createInlineCompletionProvider(monaco);

      inlineCompletionProviderRef.current = monaco.languages.registerInlineCompletionsProvider(language, provider);

      // Small delay to ensure editor is ready, then trigger suggestions
      setTimeout(() => {
        if (editorRef.current && !isAcceptingSuggestionRef.current && !suggestionAcceptedRef.current) {
          // console.log('3️⃣ 🚀 TRIGGERING: Inline suggestions');
          editor.trigger('ai', 'editor.action.inlineSuggest.trigger', null);
        } else {
          // console.log('3️⃣ ❌ BLOCKED: Cannot trigger suggestions - editor state changed');
        }
      }, 50);
    } else {
      // console.log('2️⃣ ℹ️ INFO: No suggestion or position available, skipping provider registration');
    }

    // console.groupEnd();

    return () => {
      if (inlineCompletionProviderRef.current) {
        // console.log('🧹 CLEANUP: Disposing provider on unmount');
        inlineCompletionProviderRef.current.dispose();
        inlineCompletionProviderRef.current = null;
      }
    };
  }, [suggestion, suggestionPosition, activeFile, createInlineCompletionProvider]);

  const handleEditorDidMount = (editor: MonacoEditor, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    // console.log('Editor instance mounted:', !!editorRef.current);

    editor.updateOptions({
      ...defaultEditorOptions,
      // Enable inline suggestions but with specific settings to prevent conflicts
      inlineSuggest: {
        enabled: true,
        mode: 'prefix',
        suppressSuggestions: false,
      },
      // Disable some conflicting suggest features
      suggest: {
        preview: false, // Disable preview to avoid conflicts
        showInlineDetails: false,
        insertMode: 'replace',
      },
      // Quick suggestions
      quickSuggestions: {
        other: true,
        comments: false,
        strings: false,
      },
      // Smooth cursor
      cursorSmoothCaretAnimation: 'on',
    });

    configureMonaco(monaco);

    // Keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space, () => {
      // console.log('Ctrl+Space pressed, triggering suggestion');
      onTriggerSuggestion('completion', editor);
    });

    // CRITICAL: Override Tab key with high priority and prevent default Monaco behavior
    if (tabCommandRef.current && typeof tabCommandRef.current.dispose === 'function') {
      tabCommandRef.current.dispose();
    }

    tabCommandRef.current = editor.addCommand(
      monaco.KeyCode.Tab,
      () => {
        // console.group('⌨️ Tab Key Press Flow');
        // console.log('1️⃣ Tab Pressed - Initial State:', {
        //   hasSuggestion: !!currentSuggestionRef.current,
        //   hasActiveSuggestion: hasActiveSuggestionAtPosition(),
        //   isAccepting: isAcceptingSuggestionRef.current,
        //   suggestionAccepted: suggestionAcceptedRef.current,
        // });

        // CRITICAL: Block if already processing
        if (isAcceptingSuggestionRef.current) {
          // console.log('2️⃣ ❌ BLOCKED: Already in the process of accepting, ignoring Tab');
          // console.groupEnd();
          return;
        }

        // CRITICAL: Block if just accepted
        if (suggestionAcceptedRef.current) {
          // console.log('2️⃣ ❌ BLOCKED: Suggestion was just accepted, using default tab');
          editor.trigger('keyboard', 'tab', null);
          // console.groupEnd();
          return;
        }

        // If we have an active suggestion at the current position, try to accept it
        if (currentSuggestionRef.current && hasActiveSuggestionAtPosition()) {
          // console.log('2️⃣ ✅ PROCEEDING: Attempting to accept suggestion with Tab');
          const accepted = acceptCurrentSuggestion();
          if (accepted) {
            console.log('3️⃣ ✅ SUCCESS: Suggestion accepted via Tab, preventing default behavior');
            // console.groupEnd();
            return; // CRITICAL: Return here to prevent default tab behavior
          }
          // console.log('3️⃣ ❌ FAILED: Suggestion acceptance failed, falling through to default');
        } else {
          // console.log('2️⃣ ℹ️ INFO: No active suggestion at current position');
        }

        // Default tab behavior (indentation)
        // console.log('3️⃣ 📝 DEFAULT: Using default tab behavior (indentation)');
        editor.trigger('keyboard', 'tab', null);
        // console.groupEnd();
      },
      // CRITICAL: Use specific context to override Monaco's built-in Tab handling
      'editorTextFocus && !editorReadonly && !suggestWidgetVisible'
    );

    // Escape to reject
    editor.addCommand(monaco.KeyCode.Escape, () => {
      // console.log('Escape pressed');
      if (currentSuggestionRef.current) {
        onRejectSuggestion(editor);
        clearCurrentSuggestion();
      }
    });

    // Listen for cursor position changes to hide suggestions when moving away
    editor.onDidChangeCursorPosition((e: any) => {
      if (isAcceptingSuggestionRef.current) return;

      const newPosition = e.position;

      // Clear existing suggestion if cursor moved away
      if (currentSuggestionRef.current && !suggestionAcceptedRef.current) {
        const suggestionPos = currentSuggestionRef.current.position;

        // If cursor moved away from suggestion position, clear it
        if (
          newPosition.lineNumber !== suggestionPos.line ||
          newPosition.column < suggestionPos.column ||
          newPosition.column > suggestionPos.column + 10
        ) {
          // console.log('Cursor moved away from suggestion, clearing');
          clearCurrentSuggestion();
          onRejectSuggestion(editor);
        }
      }

      // Trigger new suggestion if appropriate (simplified)
      if (!currentSuggestionRef.current && !suggestionLoading) {
        // Clear any existing timeout
        if (suggestionTimeoutRef.current) {
          clearTimeout(suggestionTimeoutRef.current);
        }

        // Trigger suggestion with a delay
        suggestionTimeoutRef.current = setTimeout(() => {
          onTriggerSuggestion('completion', editor);
        }, 300);
      }
    });

    // Listen for content changes to detect manual typing over suggestions
    editor.onDidChangeModelContent((e: any) => {
      if (isAcceptingSuggestionRef.current) return;

      // If user types while there's a suggestion, clear it (unless it's our insertion)
      if (currentSuggestionRef.current && e.changes.length > 0 && !suggestionAcceptedRef.current) {
        const change = e.changes[0];

        // Check if this is our own suggestion insertion
        if (change.text === currentSuggestionRef.current.text || change.text === currentSuggestionRef.current.text.replace(/\r/g, '')) {
          // console.log('Our suggestion was inserted, not clearing');
          return;
        }

        // User typed something else, clear the suggestion
        // console.log('User typed while suggestion active, clearing');
        clearCurrentSuggestion();
      }

      // Trigger context-aware suggestions on certain typing patterns
      if (e.changes.length > 0 && !suggestionAcceptedRef.current) {
        const change = e.changes[0];

        // Trigger suggestions after specific characters
        if (
          change.text === '\n' || // New line
          change.text === '{' || // Opening brace
          change.text === '.' || // Dot notation
          change.text === '=' || // Assignment
          change.text === '(' || // Function call
          change.text === ',' || // Parameter separator
          change.text === ':' || // Object property
          change.text === ';' // Statement end
        ) {
          setTimeout(() => {
            if (editorRef.current && !currentSuggestionRef.current && !suggestionLoading) {
              onTriggerSuggestion('completion', editor);
            }
          }, 100); // Small delay to let the change settle
        }
      }
    });

    updateEditorLanguage();
  };

  const updateEditorLanguage = useCallback(() => {
    if (!activeFile || !monacoRef.current || !editorRef.current) return;
    const model = editorRef.current.getModel();
    if (!model) return;

    const language = getEditorLanguage(activeFile.fileExtension || '');
    try {
      monacoRef.current.editor.setModelLanguage(model, language);
    } catch (error) {
      console.warn('Failed to set editor language:', error);
    }
  }, [activeFile]);

  useEffect(() => {
    updateEditorLanguage();
  }, [activeFile, updateEditorLanguage]);

  // Cleanup on unmount
  useEffect(() => {
    // Set up periodic cleanup of stale suggestions
    const staleSuggestionInterval = setInterval(clearStaleSuggestion, 2000); // Check every 2 seconds

    return () => {
      clearInterval(staleSuggestionInterval);
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
      }
      if (inlineCompletionProviderRef.current) {
        inlineCompletionProviderRef.current.dispose();
        inlineCompletionProviderRef.current = null;
      }
      if (tabCommandRef.current && typeof tabCommandRef.current.dispose === 'function') {
        tabCommandRef.current.dispose();
        tabCommandRef.current = null;
      }
    };
  }, [clearStaleSuggestion]);

  // Hook to add suggestion widget with buttons
  // Must be called unconditionally to follow Rules of Hooks
  useSuggestionWidget({
    editor: editorRef.current,
    monaco: monacoRef.current,
    suggestion: suggestion || '',
    position: suggestionPosition || { line: 0, column: 0 },
    onAccept: () => {
      if (editorRef.current && monacoRef.current) {
        const accepted = acceptCurrentSuggestion();
        if (accepted) {
          onAcceptSuggestion(editorRef.current, monacoRef.current);
        }
      }
    },
    onReject: () => {
      if (editorRef.current) {
        clearCurrentSuggestion();
        onRejectSuggestion(editorRef.current);
      }
    },
  });

  return (
    <div className='h-full relative'>
      {/* Loading indicator */}
      {suggestionLoading && (
        <div className='absolute top-2 right-2 z-10 bg-red-100 dark:bg-red-900 px-2 py-1 rounded text-xs text-red-700 dark:text-red-300 flex items-center gap-1'>
          <div className='w-2 h-2 bg-red-500 rounded-full animate-pulse'></div>
          AI thinking...
        </div>
      )}

      {/* Active suggestion indicator - removed since we now have inline buttons */}
      {/* {currentSuggestionRef.current && !suggestionLoading && (
        <div className='absolute top-2 right-2 z-10 bg-green-100 dark:bg-green-900 px-2 py-1 rounded text-xs text-green-700 dark:text-green-300 flex items-center gap-1'>
          <div className='w-2 h-2 bg-green-500 rounded-full'></div>
          Press Tab to accept
        </div>
      )} */}

      <Editor
        height='100%'
        value={content}
        onChange={value => onContentChange(value || '')}
        onMount={handleEditorDidMount}
        language={activeFile ? getEditorLanguage(activeFile.fileExtension || '') : 'plaintext'}
        options={defaultEditorOptions as any}
      />
    </div>
  );
};
