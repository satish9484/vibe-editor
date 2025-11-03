'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Copy, Download, RefreshCw, Search, Trash2, XCircle } from 'lucide-react';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import 'xterm/css/xterm.css';

interface TerminalProps {
  webcontainerUrl?: string;
  className?: string;
  theme?: 'dark' | 'light';
  webContainerInstance?: any;
}

// Define the methods that will be exposed through the ref
export interface TerminalRef {
  writeToTerminal: (data: string) => void;
  clearTerminal: () => void;
  focusTerminal: () => void;
}

const TerminalComponent = forwardRef<TerminalRef, TerminalProps>(({ webcontainerUrl, className, theme = 'dark', webContainerInstance }, ref) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const term = useRef<any>(null);
  const fitAddon = useRef<any>(null);
  const searchAddon = useRef<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Command line state
  const currentLine = useRef<string>('');
  const cursorPosition = useRef<number>(0);
  const commandHistory = useRef<string[]>([]);
  const historyIndex = useRef<number>(-1);
  const currentProcess = useRef<any>(null);
  const shellProcess = useRef<any>(null);

  const terminalThemes = {
    dark: {
      background: '#09090B',
      foreground: '#FAFAFA',
      cursor: '#FAFAFA',
      cursorAccent: '#09090B',
      selection: '#27272A',
      black: '#18181B',
      red: '#EF4444',
      green: '#22C55E',
      yellow: '#EAB308',
      blue: '#3B82F6',
      magenta: '#A855F7',
      cyan: '#06B6D4',
      white: '#F4F4F5',
      brightBlack: '#3F3F46',
      brightRed: '#F87171',
      brightGreen: '#4ADE80',
      brightYellow: '#FDE047',
      brightBlue: '#60A5FA',
      brightMagenta: '#C084FC',
      brightCyan: '#22D3EE',
      brightWhite: '#FFFFFF',
    },
    light: {
      background: '#FFFFFF',
      foreground: '#18181B',
      cursor: '#18181B',
      cursorAccent: '#FFFFFF',
      selection: '#E4E4E7',
      black: '#18181B',
      red: '#DC2626',
      green: '#16A34A',
      yellow: '#CA8A04',
      blue: '#2563EB',
      magenta: '#9333EA',
      cyan: '#0891B2',
      white: '#F4F4F5',
      brightBlack: '#71717A',
      brightRed: '#EF4444',
      brightGreen: '#22C55E',
      brightYellow: '#EAB308',
      brightBlue: '#3B82F6',
      brightMagenta: '#A855F7',
      brightCyan: '#06B6D4',
      brightWhite: '#FAFAFA',
    },
  };

  const writePrompt = useCallback(() => {
    if (term.current) {
      term.current.write('\r\n$ ');
      currentLine.current = '';
      cursorPosition.current = 0;
    }
  }, []);

  // Expose methods through ref
  useImperativeHandle(ref, () => ({
    writeToTerminal: (data: string) => {
      if (term.current) {
        term.current.write(data);
      }
    },
    clearTerminal: () => {
      clearTerminal();
    },
    focusTerminal: () => {
      if (term.current) {
        term.current.focus();
      }
    },
  }));

  const executeCommand = useCallback(
    async (command: string) => {
      // console.group('⚡ Command Execution Flow');

      // console.log('1️⃣ Command Received:', {
      //   command: command,
      //   commandLength: command.length,
      //   hasWebContainer: !!webContainerInstance,
      //   hasTerminal: !!term.current,
      // });

      if (!webContainerInstance || !term.current) {
        // console.log('1️⃣ ❌ BLOCKED: Cannot execute command - missing WebContainer or terminal');
        // console.groupEnd();
        return;
      }

      // Add to history
      if (command.trim() && commandHistory.current[commandHistory.current.length - 1] !== command) {
        commandHistory.current.push(command);

        // console.log('2️⃣ 📝 Command added to history:', {
        //   historyLength: commandHistory.current.length,
        //   command: command.trim(),
        // });
      }
      historyIndex.current = -1;

      try {
        // Handle built-in commands
        if (command.trim() === 'clear') {
          // console.log('2️⃣ 🧹 Built-in Command: Clear terminal');
          term.current.clear();
          writePrompt();

          // console.log('3️⃣ ✅ SUCCESS: Terminal cleared');
          // console.groupEnd();
          return;
        }

        if (command.trim() === 'history') {
          // console.log('2️⃣ 📚 Built-in Command: Show history');
          commandHistory.current.forEach((cmd, index) => {
            term.current!.writeln(`  ${index + 1}  ${cmd}`);
          });
          writePrompt();

          // console.log('3️⃣ ✅ SUCCESS: History displayed');
          // console.groupEnd();
          return;
        }

        if (command.trim() === '') {
          // console.log('2️⃣ ℹ️ Empty command - showing prompt');
          writePrompt();
          // console.groupEnd();
          return;
        }

        // Parse command
        const parts = command.trim().split(' ');
        const cmd = parts[0];
        const args = parts.slice(1);

        // console.log('2️⃣ 🔍 Parsing command:', {
        //   command: cmd,
        //   arguments: args,
        //   argumentCount: args.length,
        // });

        // Execute in WebContainer
        term.current.writeln('');

        // console.log('3️⃣ 🚀 Spawning process in WebContainer:', {
        //   command: cmd,
        //   args: args,
        //   terminalCols: term.current.cols,
        //   terminalRows: term.current.rows,
        // });

        const process = await webContainerInstance.spawn(cmd, args, {
          terminal: {
            cols: term.current.cols,
            rows: term.current.rows,
          },
        });

        currentProcess.current = process;

        // console.log('4️⃣ 📡 Process spawned successfully');

        // Handle process output
        process.output.pipeTo(
          new WritableStream({
            write(data) {
              if (term.current) {
                term.current.write(data);
              }
            },
          })
        );

        // console.log('5️⃣ 📤 Output stream connected');

        // Wait for process to complete

        // console.log('6️⃣ ⏳ Waiting for process to complete...');
        const exitCode = await process.exit;
        currentProcess.current = null;

        // console.log('7️⃣ ✅ Process completed:', {
        //   exitCode: exitCode,
        //   success: exitCode === 0,
        // });

        // Show new prompt
        writePrompt();

        // console.log('8️⃣ ✅ SUCCESS: Command execution completed');
        // console.groupEnd();
      } catch (error) {
        console.error('❌ ERROR: Command execution failed:', error);
        if (term.current) {
          term.current.writeln(`\r\nCommand not found: ${command}`);
          writePrompt();
        }
        currentProcess.current = null;
        // console.groupEnd();
      }
    },
    [webContainerInstance, writePrompt]
  );

  const handleTerminalInput = useCallback(
    (data: string) => {
      // console.group('⌨️ Terminal Input Flow');

      // console.log('1️⃣ Input Received:', {
      //   data: data,
      //   dataLength: data.length,
      //   charCode: data.charCodeAt(0),
      //   hasTerminal: !!term.current,
      // });

      if (!term.current) {
        // console.log('1️⃣ ❌ BLOCKED: No terminal available');
        // console.groupEnd();
        return;
      }

      // Handle special characters
      switch (data) {
        case '\r': // Enter
          // console.log('2️⃣ ⌨️ Special Key: Enter pressed');

          // console.log('3️⃣ 🚀 Executing command:', {
          //   command: currentLine.current,
          //   commandLength: currentLine.current.length,
          // });
          executeCommand(currentLine.current);
          // console.groupEnd();
          break;

        case '\u007F': // Backspace
          // console.log('2️⃣ ⌨️ Special Key: Backspace pressed');
          if (cursorPosition.current > 0) {
            currentLine.current = currentLine.current.slice(0, cursorPosition.current - 1) + currentLine.current.slice(cursorPosition.current);
            cursorPosition.current--;

            // console.log('3️⃣ ✅ Character removed:', {
            //   newLine: currentLine.current,
            //   newCursorPosition: cursorPosition.current,
            // });
            // Update terminal display
            term.current.write('\b \b');
          } else {
            // console.log('3️⃣ ℹ️ Backspace ignored - at beginning of line');
          }
          // console.groupEnd();
          break;

        case '\u0003': // Ctrl+C
          // console.log('2️⃣ ⌨️ Special Key: Ctrl+C pressed');
          if (currentProcess.current) {
            // console.log('3️⃣ 🛑 Killing current process');
            currentProcess.current.kill();
            currentProcess.current = null;
          }
          term.current.writeln('^C');
          writePrompt();

          // console.log('4️⃣ ✅ Process killed and prompt shown');
          // console.groupEnd();
          break;

        case '\u001b[A': // Up arrow
          // console.log('2️⃣ ⌨️ Special Key: Up arrow pressed');
          if (commandHistory.current.length > 0) {
            if (historyIndex.current === -1) {
              historyIndex.current = commandHistory.current.length - 1;
            } else if (historyIndex.current > 0) {
              historyIndex.current--;
            }

            // console.log('3️⃣ 📚 History navigation:', {
            //   historyIndex: historyIndex.current,
            //   totalHistory: commandHistory.current.length,
            // });
            // Clear current line and write history command
            const historyCommand = commandHistory.current[historyIndex.current];
            term.current.write('\r$ ' + ' '.repeat(currentLine.current.length) + '\r$ ');
            term.current.write(historyCommand);
            currentLine.current = historyCommand;
            cursorPosition.current = historyCommand.length;

            // console.log('4️⃣ ✅ History command loaded:', {
            //   command: historyCommand,
            //   cursorPosition: cursorPosition.current,
            // });
          } else {
            // console.log('3️⃣ ℹ️ No command history available');
          }
          // console.groupEnd();
          break;

        case '\u001b[B': // Down arrow
          // console.log('2️⃣ ⌨️ Special Key: Down arrow pressed');
          if (historyIndex.current !== -1) {
            if (historyIndex.current < commandHistory.current.length - 1) {
              historyIndex.current++;
              const historyCommand = commandHistory.current[historyIndex.current];

              // console.log('3️⃣ 📚 History navigation:', {
              //   historyIndex: historyIndex.current,
              //   command: historyCommand,
              // });
              term.current.write('\r$ ' + ' '.repeat(currentLine.current.length) + '\r$ ');
              term.current.write(historyCommand);
              currentLine.current = historyCommand;
              cursorPosition.current = historyCommand.length;
            } else {
              historyIndex.current = -1;

              // console.log('3️⃣ 📚 History navigation: Back to empty line');
              term.current.write('\r$ ' + ' '.repeat(currentLine.current.length) + '\r$ ');
              currentLine.current = '';
              cursorPosition.current = 0;
            }

            // console.log('4️⃣ ✅ History command loaded');
          } else {
            // console.log('3️⃣ ℹ️ No history navigation active');
          }
          // console.groupEnd();
          break;

        default:
          // Regular character input
          if (data >= ' ' || data === '\t') {
            // console.log('2️⃣ ⌨️ Regular Character:', {
            //   character: data,
            //   charCode: data.charCodeAt(0),
            // });
            currentLine.current = currentLine.current.slice(0, cursorPosition.current) + data + currentLine.current.slice(cursorPosition.current);
            cursorPosition.current++;
            term.current.write(data);

            // console.log('3️⃣ ✅ Character added:', {
            //   newLine: currentLine.current,
            //   newCursorPosition: cursorPosition.current,
            // });
          } else {
            // console.log('2️⃣ ℹ️ Ignored character:', {
            //   character: data,
            //   charCode: data.charCodeAt(0),
            // });
          }
          // console.groupEnd();
          break;
      }
    },
    [executeCommand, writePrompt]
  );

  const initializeTerminal = useCallback(async () => {
    // console.group('🖥️ Terminal Initialization Flow');

    // console.log('1️⃣ Initialization Check:', {
    //   hasTerminalRef: !!terminalRef.current,
    //   hasExistingTerm: !!term.current,
    //   isClientSide: typeof window !== 'undefined',
    //   retryAttempt: retryCount + 1,
    // });

    if (!terminalRef.current || term.current || typeof window === 'undefined') {
      // console.log('1️⃣ ❌ BLOCKED: Cannot initialize terminal - missing requirements');
      // console.groupEnd();
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // console.log('2️⃣ ✅ PROCEEDING: Starting terminal initialization');

      // Dynamically import xterm libraries only on client side

      // console.log('3️⃣ 📦 Loading xterm libraries...');
      const { Terminal } = await import('xterm');
      const { FitAddon } = await import('xterm-addon-fit');
      const { WebLinksAddon } = await import('xterm-addon-web-links');
      const { SearchAddon } = await import('xterm-addon-search');

      // console.log('3️⃣ ✅ SUCCESS: xterm libraries loaded successfully');

      // console.log('4️⃣ 🔧 Creating terminal instance...');
      const terminal = new Terminal({
        cursorBlink: true,
        fontFamily: '"Fira Code", "JetBrains Mono", "Consolas", monospace',
        fontSize: 14,
        lineHeight: 1.2,
        letterSpacing: 0,
        theme: terminalThemes[theme],
        allowTransparency: false,
        convertEol: true,
        scrollback: 1000,
        tabStopWidth: 4,
      });

      // Add addons

      // console.log('5️⃣ 🔌 Loading terminal addons...');
      const fitAddonInstance = new FitAddon();
      const webLinksAddon = new WebLinksAddon();
      const searchAddonInstance = new SearchAddon();

      terminal.loadAddon(fitAddonInstance);
      terminal.loadAddon(webLinksAddon);
      terminal.loadAddon(searchAddonInstance);

      // console.log('6️⃣ 🖼️ Opening terminal in DOM...');
      terminal.open(terminalRef.current);

      fitAddon.current = fitAddonInstance;
      searchAddon.current = searchAddonInstance;
      term.current = terminal;

      // Handle terminal input
      terminal.onData(handleTerminalInput);

      // console.log('7️⃣ ⌨️ Terminal input handler attached');

      // Initial fit
      setTimeout(() => {
        fitAddonInstance.fit();

        // console.log('8️⃣ 📏 Terminal fitted to container');
      }, 100);

      // Welcome message
      terminal.writeln('🚀 WebContainer Terminal');
      terminal.writeln("Type 'help' for available commands");
      writePrompt();

      // console.log('9️⃣ 💬 Welcome message displayed');

      // console.log('🔟 ✅ SUCCESS: Terminal initialized successfully', {
      //   retryCount: 0,
      //   isLoaded: true,
      //   isLoading: false,
      // });
      setIsLoaded(true);
      setIsLoading(false);
      setRetryCount(0);
      // console.groupEnd();
      return terminal;
    } catch (error) {
      console.error('❌ ERROR: Failed to initialize terminal:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to initialize terminal: ${errorMessage}`);
      setIsLoaded(false);
      setIsLoading(false);

      // Auto-retry up to 3 times with exponential backoff
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s

        // console.log(`🔄 RETRY: Retrying terminal initialization in ${delay}ms... (attempt ${retryCount + 1}/3)`);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          initializeTerminal();
        }, delay);
      } else {
        // console.log('❌ FAILED: Maximum retry attempts reached');
      }
      // console.groupEnd();
    }
  }, [theme, handleTerminalInput, writePrompt, retryCount]);

  const connectToWebContainer = useCallback(async () => {
    // console.group('🔗 WebContainer Connection Flow');

    // console.log('1️⃣ Connection Check:', {
    //   hasWebContainerInstance: !!webContainerInstance,
    //   hasTerminal: !!term.current,
    //   isConnected: isConnected,
    // });

    if (!webContainerInstance || !term.current) {
      // console.log('1️⃣ ❌ BLOCKED: Cannot connect - missing WebContainer instance or terminal');
      // console.groupEnd();
      return;
    }

    try {
      // console.log('2️⃣ ✅ PROCEEDING: Connecting to WebContainer');
      setIsConnected(true);
      term.current.writeln('✅ Connected to WebContainer');
      term.current.writeln('Ready to execute commands');
      writePrompt();

      // console.log('3️⃣ ✅ SUCCESS: WebContainer connection established');
      // console.groupEnd();
    } catch (error) {
      console.error('❌ ERROR: WebContainer connection failed:', error);
      setIsConnected(false);
      term.current.writeln('❌ Failed to connect to WebContainer');
      // console.groupEnd();
    }
  }, [webContainerInstance, writePrompt, isConnected]);

  const retryInitialization = useCallback(() => {
    // console.log('Manual retry requested');
    setRetryCount(0);
    setError(null);
    setIsLoaded(false);
    setIsLoading(true);

    // Clean up existing terminal
    if (term.current) {
      term.current.dispose();
      term.current = null;
    }
    if (fitAddon.current) {
      fitAddon.current = null;
    }
    if (searchAddon.current) {
      searchAddon.current = null;
    }

    // Reinitialize
    setTimeout(() => {
      initializeTerminal();
    }, 100);
  }, [initializeTerminal]);

  const clearTerminal = useCallback(() => {
    if (term.current) {
      term.current.clear();
      term.current.writeln('🚀 WebContainer Terminal');
      writePrompt();
    }
  }, [writePrompt]);

  const copyTerminalContent = useCallback(async () => {
    if (term.current) {
      const content = term.current.getSelection();
      if (content) {
        try {
          await navigator.clipboard.writeText(content);
        } catch (error) {
          console.error('Failed to copy to clipboard:', error);
        }
      }
    }
  }, []);

  const downloadTerminalLog = useCallback(() => {
    if (term.current) {
      const buffer = term.current.buffer.active;
      let content = '';

      for (let i = 0; i < buffer.length; i++) {
        const line = buffer.getLine(i);
        if (line) {
          content += line.translateToString(true) + '\n';
        }
      }

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `terminal-log-${new Date().toISOString().slice(0, 19)}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, []);

  const searchInTerminal = useCallback((term: string) => {
    if (searchAddon.current && term) {
      searchAddon.current.findNext(term);
    }
  }, []);

  useEffect(() => {
    // console.group('🔄 Terminal useEffect - Initialization');

    // console.log('1️⃣ Effect Triggered:', {
    //   isClientSide: typeof window !== 'undefined',
    //   hasTerminalRef: !!terminalRef.current,
    // });

    if (typeof window !== 'undefined') {
      // console.log('2️⃣ ✅ PROCEEDING: Starting terminal initialization');
      initializeTerminal();
    } else {
      // console.log('2️⃣ ❌ BLOCKED: Not client-side, skipping initialization');
    }

    // Handle resize

    // console.log('3️⃣ 📏 Setting up resize observer');
    const resizeObserver = new ResizeObserver(() => {
      if (fitAddon.current) {
        setTimeout(() => {
          fitAddon.current?.fit();

          // console.log('📏 Terminal resized and fitted');
        }, 100);
      }
    });

    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);

      // console.log('4️⃣ ✅ Resize observer attached to terminal ref');
    } else {
      // console.log('4️⃣ ⚠️ WARNING: No terminal ref available for resize observer');
    }

    // console.log('5️⃣ ✅ SUCCESS: useEffect setup completed');
    // console.groupEnd();

    return () => {
      // console.log('🧹 CLEANUP: Terminal useEffect cleanup');
      resizeObserver.disconnect();
      if (currentProcess.current) {
        currentProcess.current.kill();
      }
      if (shellProcess.current) {
        shellProcess.current.kill();
      }
      if (term.current) {
        term.current.dispose();
        term.current = null;
      }
    };
  }, [initializeTerminal]);

  useEffect(() => {
    // console.group('🔗 WebContainer Connection useEffect');

    // console.log('1️⃣ Effect Triggered:', {
    //   hasWebContainerInstance: !!webContainerInstance,
    //   hasTerminal: !!term.current,
    //   isConnected: isConnected,
    // });

    if (webContainerInstance && term.current && !isConnected) {
      // console.log('2️⃣ ✅ PROCEEDING: Connecting to WebContainer');
      connectToWebContainer();
    } else {
      // console.log('2️⃣ ❌ BLOCKED: Cannot connect to WebContainer', {
      //   reason: !webContainerInstance ? 'No WebContainer instance' : !term.current ? 'No terminal' : isConnected ? 'Already connected' : 'Unknown',
      // });
    }
    // console.groupEnd();
  }, [webContainerInstance, connectToWebContainer, isConnected]);

  // Note: We always render the terminal container so the ref exists early;
  // a loading overlay is shown while initializing.

  // Show error state with retry option
  if (error && !isLoaded) {
    return (
      <div className={cn('flex flex-col h-full bg-background border rounded-lg overflow-hidden', className)}>
        <div className='flex items-center justify-center h-full'>
          <div className='text-center max-w-md p-6'>
            <div className='w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4'>
              <XCircle className='h-6 w-6 text-red-600 dark:text-red-400' />
            </div>
            <h3 className='text-lg font-semibold text-red-600 dark:text-red-400 mb-2'>Terminal Initialization Failed</h3>
            <p className='text-sm text-muted-foreground mb-4'>{error}</p>
            <div className='space-y-2'>
              <Button onClick={retryInitialization} className='w-full'>
                <RefreshCw className='h-4 w-4 mr-2' />
                Retry Initialization
              </Button>
              <p className='text-xs text-muted-foreground'>
                If the problem persists, try refreshing the page or check your browser console for more details.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full bg-background border rounded-lg overflow-hidden relative', className)}>
      {/* Terminal Header */}
      <div className='flex items-center justify-between px-3 py-2 border-b bg-muted/50'>
        <div className='flex items-center gap-2'>
          <div className='flex gap-1'>
            <div className='w-3 h-3 rounded-full bg-red-500'></div>
            <div className='w-3 h-3 rounded-full bg-yellow-500'></div>
            <div className='w-3 h-3 rounded-full bg-green-500'></div>
          </div>
          <span className='text-sm font-medium'>WebContainer Terminal</span>
          {isConnected && (
            <div className='flex items-center gap-1'>
              <div className='w-2 h-2 rounded-full bg-green-500 animate-pulse'></div>
              <span className='text-xs text-muted-foreground'>Connected</span>
            </div>
          )}
        </div>

        <div className='flex items-center gap-1'>
          {showSearch && (
            <div className='flex items-center gap-2'>
              <Input
                placeholder='Search...'
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  searchInTerminal(e.target.value);
                }}
                className='h-6 w-32 text-xs'
              />
            </div>
          )}

          <Button variant='ghost' size='sm' onClick={() => setShowSearch(!showSearch)} className='h-6 w-6 p-0'>
            <Search className='h-3 w-3' />
          </Button>

          <Button variant='ghost' size='sm' onClick={copyTerminalContent} className='h-6 w-6 p-0'>
            <Copy className='h-3 w-3' />
          </Button>

          <Button variant='ghost' size='sm' onClick={downloadTerminalLog} className='h-6 w-6 p-0'>
            <Download className='h-3 w-3' />
          </Button>

          <Button variant='ghost' size='sm' onClick={clearTerminal} className='h-6 w-6 p-0'>
            <Trash2 className='h-3 w-3' />
          </Button>
        </div>
      </div>

      {/* Terminal Content */}
      <div className='flex-1 relative'>
        <div
          ref={terminalRef}
          className='absolute inset-0 p-2'
          style={{
            background: terminalThemes[theme].background,
          }}
        />
        {isLoading && (
          <div className='absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2'></div>
              <p className='text-sm text-muted-foreground'>Loading Terminal...</p>
              <p className='text-xs text-muted-foreground mt-1'>Initializing xterm.js</p>
              {retryCount > 0 && <p className='text-xs text-orange-600 mt-1'>Retry attempt {retryCount}/3</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

TerminalComponent.displayName = 'TerminalComponent';

export default TerminalComponent;
