'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Progress } from '@/components/ui/progress';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { transformToWebContainerFormat } from '../hooks/transformer';

import { TemplateFolder } from '@/modules/playground/lib/path-to-json';
import TerminalComponent from './terminal';

interface WebContainerPreviewProps {
  templateData: TemplateFolder;
  serverUrl: string;
  isLoading: boolean;
  error: string | null;
  instance: any;
  writeFileSync: (path: string, content: string) => Promise<void>;
  forceResetup?: boolean; // Optional prop to force re-setup
  retryCount?: number;
  isRetrying?: boolean;
  retryInitialization?: () => void;
}
const WebContainerPreview = ({
  templateData,
  error,
  instance,
  isLoading,
  serverUrl,
  writeFileSync,
  forceResetup = false,
  retryCount = 0,
  isRetrying = false,
  retryInitialization,
}: WebContainerPreviewProps) => {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [loadingState, setLoadingState] = useState({
    transforming: false,
    mounting: false,
    installing: false,
    starting: false,
    ready: false,
  });
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = 4;
  const [setupError, setSetupError] = useState<string | null>(null);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [isSetupInProgress, setIsSetupInProgress] = useState(false);

  const terminalRef = useRef<any>(null);
  const serverProcessRef = useRef<any>(null);
  const serverReadyListenerRef = useRef<(() => void) | null>(null);
  const isManuallyStoppedRef = useRef<boolean>(false);

  // Function to stop the development server
  const stopServer = useCallback(() => {
    console.group('🛑 Stop Server Flow');
    console.log('1️⃣ Stop Request:', {
      hasServerProcess: !!serverProcessRef.current,
      hasListener: !!serverReadyListenerRef.current,
      isSetupComplete: isSetupComplete,
    });

    // Mark as manually stopped to prevent auto-reconnection
    isManuallyStoppedRef.current = true;

    // Kill server process
    if (serverProcessRef.current) {
      console.log('2️⃣ 🛑 Stopping server process');
      try {
        serverProcessRef.current.kill();
        console.log('2️⃣ ✅ Server process killed successfully');
        if (terminalRef.current?.writeToTerminal) {
          terminalRef.current.writeToTerminal('🛑 Development server stopped\r\n');
        }
      } catch (error) {
        console.error('⚠️ Error stopping server process:', error);
      }
      serverProcessRef.current = null;
    } else {
      console.log('2️⃣ ℹ️ No server process to stop');
    }

    // Clear the listener reference (note: WebContainer doesn't have .off() method)
    if (serverReadyListenerRef.current) {
      console.log('2️⃣ 🧹 Clearing server-ready listener reference');
      serverReadyListenerRef.current = null;
    }

    // Reset states
    setPreviewUrl('');
    setIsSetupComplete(false);
    setIsSetupInProgress(false);
    setLoadingState({
      transforming: false,
      mounting: false,
      installing: false,
      starting: false,
      ready: false,
    });
    setCurrentStep(0);
    setSetupError(null);

    console.log('3️⃣ ✅ SUCCESS: Server stopped and states reset');
    console.groupEnd();
  }, [isSetupComplete]);

  // Function to detect and get appropriate start command
  const getStartCommand = useCallback(async (instance: any) => {
    /* Commented out: Start command detection logs - uncomment to see detection flow
    console.group('🔍 Start Command Detection Flow');
    console.log('1️⃣ Detection Started:', {
      hasInstance: !!instance,
    });
    */

    try {
      /* console.log('2️⃣ 📄 Reading package.json...'); */
      // Try to read package.json to determine the correct start command
      const packageJsonContent = await instance.fs.readFile('package.json', 'utf8');
      const packageJson = JSON.parse(packageJsonContent);
      /* console.log('2️⃣ ✅ package.json loaded successfully');

      console.log('3️⃣ 🔍 Analyzing package.json:', {
        hasScripts: !!packageJson.scripts,
        scripts: packageJson.scripts,
        dependencies: Object.keys(packageJson.dependencies || {}),
      }); */

      // Check for different start scripts
      if (packageJson.scripts) {
        if (packageJson.scripts.start) {
          /* console.log('3️⃣ ✅ Found start script:', { command: 'npm', args: ['run', 'start'] });
          console.groupEnd(); */
          return { command: 'npm', args: ['run', 'start'] };
        }
        if (packageJson.scripts.dev) {
          /* console.log('3️⃣ ✅ Found dev script:', { command: 'npm', args: ['run', 'dev'] });
          console.groupEnd(); */
          return { command: 'npm', args: ['run', 'dev'] };
        }
        if (packageJson.scripts.serve) {
          /* console.log('3️⃣ ✅ Found serve script:', { command: 'npm', args: ['run', 'serve'] });
          console.groupEnd(); */
          return { command: 'npm', args: ['run', 'serve'] };
        }
      }

      /* console.log('4️⃣ 🔍 Checking framework dependencies...'); */
      // Fallback commands based on common frameworks
      if (packageJson.dependencies?.next) {
        /* console.log('4️⃣ ✅ Detected Next.js framework:', { command: 'npm', args: ['run', 'dev'] });
        console.groupEnd(); */
        return { command: 'npm', args: ['run', 'dev'] };
      }
      if (packageJson.dependencies?.react) {
        /* console.log('4️⃣ ✅ Detected React framework:', { command: 'npm', args: ['start'] });
        console.groupEnd(); */
        return { command: 'npm', args: ['start'] };
      }
      if (packageJson.dependencies?.vue) {
        /* console.log('4️⃣ ✅ Detected Vue framework:', { command: 'npm', args: ['run', 'dev'] });
        console.groupEnd(); */
        return { command: 'npm', args: ['run', 'dev'] };
      }
      if (packageJson.dependencies?.express) {
        /* console.log('4️⃣ ✅ Detected Express framework:', { command: 'node', args: ['src/index.js'] });
        console.groupEnd(); */
        return { command: 'node', args: ['src/index.js'] };
      }

      /* console.log('5️⃣ 📋 Using default fallback command:', { command: 'npm', args: ['start'] });
      console.groupEnd(); */
      // Default fallback
      return { command: 'npm', args: ['start'] };
    } catch (error) {
      console.error('❌ ERROR: Could not read package.json:', error);
      /* console.log('5️⃣ ⚠️ Using default fallback due to error:', { command: 'npm', args: ['start'] });
      console.groupEnd(); */
      return { command: 'npm', args: ['start'] };
    }
  }, []);

  // Reset setup state when forceResetup changes
  useEffect(() => {
    if (forceResetup) {
      // Allow reconnection after manual reset
      isManuallyStoppedRef.current = false;
      setIsSetupComplete(false);
      setIsSetupInProgress(false);
      setPreviewUrl('');
      setCurrentStep(0);
      setLoadingState({
        transforming: false,
        mounting: false,
        installing: false,
        starting: false,
        ready: false,
      });
    }
  }, [forceResetup]);

  useEffect(() => {
    async function setupContainer() {
      /* Commented out: WebContainer setup logs - uncomment to see detailed setup flow
      console.group('🏗️ WebContainer Setup Flow');
      console.log('1️⃣ Setup Check:', {
        hasInstance: !!instance,
        isSetupComplete: isSetupComplete,
        isSetupInProgress: isSetupInProgress,
        hasTemplateData: !!templateData,
      });
      */

      if (!instance || isSetupComplete || isSetupInProgress || isManuallyStoppedRef.current) {
        /* console.log('1️⃣ ❌ BLOCKED: Cannot setup container', {
          reason: !instance ? 'No instance' : isSetupComplete ? 'Already complete' : isSetupInProgress ? 'In progress' : 'Manually stopped',
        });
        console.groupEnd(); */
        return;
      }

      try {
        /* console.log('2️⃣ ✅ PROCEEDING: Starting container setup'); */
        setIsSetupInProgress(true);
        setSetupError(null);

        try {
          /* console.log('3️⃣ 🔍 Checking for existing package.json...'); */
          const packageJsonExists = await instance.fs.readFile('package.json', 'utf8');

          if (packageJsonExists) {
            console.log('3️⃣ ✅ Found existing package.json - reconnecting to server');
            // Files are already mounted, just reconnect to existing server
            if (terminalRef.current?.writeToTerminal) {
              terminalRef.current.writeToTerminal('🔄 Reconnecting to existing WebContainer session...\r\n');
            }

            const reconnectHandler = (port: number, url: string) => {
              console.log('4️⃣ 🌐 Server reconnected:', { port, url });
              if (terminalRef.current?.writeToTerminal) {
                terminalRef.current.writeToTerminal(`🌐 Reconnected to server at ${url}\r\n`);
              }

              setPreviewUrl(url);
              setLoadingState(prev => ({
                ...prev,
                starting: false,
                ready: true,
              }));
            };

            instance.on('server-ready', reconnectHandler);
            serverReadyListenerRef.current = reconnectHandler;

            setCurrentStep(4);
            setLoadingState(prev => ({ ...prev, starting: true }));
            console.log('5️⃣ ✅ SUCCESS: Reconnected to existing server');
            return;
          }
        } catch (error) {
          console.error('3️⃣ ℹ️ No existing package.json found, proceeding with full setup', error);
        }

        // Step-1 transform data
        /* console.log('4️⃣ 🔄 Step 1: Transforming template data'); */
        setLoadingState(prev => ({ ...prev, transforming: true }));
        setCurrentStep(1);
        // Write to terminal
        if (terminalRef.current?.writeToTerminal) {
          terminalRef.current.writeToTerminal('🔄 Transforming template data...\r\n');
        }

        // @ts-ignore
        console.log('4️⃣ 📋 Transforming template data:', {
          hasTemplateData: !!templateData,
          folderName: templateData.folderName,
          itemsCount: templateData.items?.length,
          firstItem: templateData.items?.[0],
        });
        const files = transformToWebContainerFormat(templateData);
        console.log('4️⃣ ✅ Template data transformed:', {
          fileCount: Object.keys(files).length,
          fileStructure: Object.keys(files),
        });
        setLoadingState(prev => ({
          ...prev,
          transforming: false,
          mounting: true,
        }));
        setCurrentStep(2);

        //  Step-2 Mount Files
        /* console.log('5️⃣ 📁 Step 2: Mounting files to WebContainer'); */
        if (terminalRef.current?.writeToTerminal) {
          terminalRef.current.writeToTerminal('📁 Mounting files to WebContainer...\r\n');
        }
        await instance.mount(files);

        if (terminalRef.current?.writeToTerminal) {
          terminalRef.current.writeToTerminal('✅ Files mounted successfully\r\n');
        }
        /* console.log('5️⃣ ✅ Files mounted successfully'); */
        setLoadingState(prev => ({
          ...prev,
          mounting: false,
          installing: true,
        }));
        setCurrentStep(3);

        // Step-3 Install dependencies (skip if node_modules already present)
        /* console.log('6️⃣ 📦 Step 3: Installing dependencies'); */
        if (terminalRef.current?.writeToTerminal) {
          terminalRef.current.writeToTerminal('📦 Installing dependencies...\r\n');
        }

        // let didInstall = false;
        try {
          // Check if node_modules exists inside the WebContainer FS
          await instance.fs.readdir('node_modules');
          /* console.log('6️⃣ ⚡ node_modules detected - skipping install'); */
          if (terminalRef.current?.writeToTerminal) {
            terminalRef.current.writeToTerminal('⚡ Skipping install (node_modules already present)\r\n');
          }
        } catch {
          // node_modules not present -> run install
          const installProcess = await instance.spawn('npm', ['install']);
          /* console.log('6️⃣ 🚀 npm install process spawned'); */

          installProcess.output.pipeTo(
            new WritableStream({
              write(data) {
                if (terminalRef.current?.writeToTerminal) {
                  terminalRef.current.writeToTerminal(data);
                }
              },
            })
          );

          /* console.log('7️⃣ ⏳ Waiting for npm install to complete...'); */
          const installExitCode = await installProcess.exit;

          if (installExitCode !== 0) {
            console.error('❌ FAILED: npm install failed', { exitCode: installExitCode });
            throw new Error(`Failed to install dependencies. Exit code: ${installExitCode}`);
          }

          // didInstall = true;
          if (terminalRef.current?.writeToTerminal) {
            terminalRef.current.writeToTerminal('✅ Dependencies installed successfully\r\n');
          }
          /* console.log('7️⃣ ✅ Dependencies installed successfully'); */
        }

        setLoadingState(prev => ({
          ...prev,
          installing: false,
          starting: true,
        }));
        setCurrentStep(4);

        // STEP-4 Start The Server
        /* console.log('8️⃣ 🚀 Step 4: Starting development server'); */
        if (terminalRef.current?.writeToTerminal) {
          terminalRef.current.writeToTerminal('🚀 Starting development server...\r\n');
        }

        // Get the appropriate start command based on package.json
        const startCommand = await getStartCommand(instance);
        /* console.log('8️⃣ 📋 Detected start command:', {
          command: startCommand.command,
          args: startCommand.args,
        }); */

        if (terminalRef.current?.writeToTerminal) {
          terminalRef.current.writeToTerminal(`📋 Using command: ${startCommand.command} ${startCommand.args.join(' ')}\r\n`);
        }

        const startProcess = await instance.spawn(startCommand.command, startCommand.args);
        serverProcessRef.current = startProcess;
        /* console.log('8️⃣ 🚀 Server process spawned and stored'); */

        // Store the listener function so we can remove it later
        const serverReadyHandler = (port: number, url: string) => {
          console.log('9️⃣ 🌐 Server ready event received:', { port, url });
          if (terminalRef.current?.writeToTerminal) {
            terminalRef.current.writeToTerminal(`🌐 Server ready at ${url}\r\n`);
          }
          setPreviewUrl(url);
          setLoadingState(prev => ({
            ...prev,
            starting: false,
            ready: true,
          }));
          setIsSetupComplete(true);
          setIsSetupInProgress(false);
          // Expose readiness to the rest of the app (lightweight global flag)
          try {
            // @ts-ignore
            (window as any).__APP_READY = true;
          } catch {}
          console.log('🔟 ✅ SUCCESS: WebContainer setup completed');
        };

        instance.on('server-ready', serverReadyHandler);
        serverReadyListenerRef.current = serverReadyHandler;

        // Handle start process output - stream to terminal
        startProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              if (terminalRef.current?.writeToTerminal) {
                terminalRef.current.writeToTerminal(data);
              }
            },
          })
        );
        /* console.log('9️⃣ 📤 Server output stream connected'); */
      } catch (err) {
        console.error('❌ ERROR: WebContainer setup failed:', err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        /* console.log('❌ FAILED: Setup error', {
          errorMessage: errorMessage,
          step: currentStep,
        }); */

        if (terminalRef.current?.writeToTerminal) {
          terminalRef.current.writeToTerminal(`❌ Setup Error: ${errorMessage}\r\n`);
          terminalRef.current.writeToTerminal('💡 Troubleshooting tips:\r\n');
          terminalRef.current.writeToTerminal('  - Check if package.json exists and is valid\r\n');
          terminalRef.current.writeToTerminal('  - Ensure all dependencies are properly defined\r\n');
          terminalRef.current.writeToTerminal('  - Try refreshing the page to restart\r\n');
        }

        setSetupError(errorMessage);
        setIsSetupInProgress(false);
        setLoadingState({
          transforming: false,
          mounting: false,
          installing: false,
          starting: false,
          ready: false,
        });
        /* console.groupEnd(); */
      }
    }

    setupContainer();
  }, [instance, templateData, isSetupComplete, isSetupInProgress, getStartCommand]);

  useEffect(() => {
    return () => {
      // Cleanup server process on unmount
      if (serverProcessRef.current) {
        /* console.log('🧹 CLEANUP: Stopping server process on unmount'); */
        try {
          serverProcessRef.current.kill();
        } catch (error) {
          console.error('⚠️ CLEANUP: Error stopping server process:', error);
        }
        serverProcessRef.current = null;
      }
    };
  }, []);

  // Keyboard shortcut to stop server (Ctrl+C)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'c' && isSetupComplete) {
        event.preventDefault();
        /* console.log('⌨️ Keyboard shortcut: Ctrl+C pressed - stopping server'); */
        stopServer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSetupComplete, stopServer]);

  if (isLoading) {
    return (
      <div className='h-full flex items-center justify-center'>
        <div className='text-center space-y-4 max-w-md p-6 rounded-lg bg-gray-50 dark:bg-gray-900'>
          <Loader2 className='h-10 w-10 animate-spin text-primary mx-auto' />
          <h3 className='text-lg font-medium'>Initializing WebContainer</h3>
          <p className='text-sm text-gray-500 dark:text-gray-400'>Setting up the environment for your project...</p>
          {isRetrying && <div className='text-sm text-orange-600 dark:text-orange-400'>Retry attempt {retryCount}/3</div>}
          {retryInitialization && (
            <button onClick={retryInitialization} className='text-sm text-blue-600 dark:text-blue-400 hover:underline'>
              Manual Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  if (error || setupError) {
    return (
      <div className='h-full flex items-center justify-center'>
        <div className='bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-lg max-w-md'>
          <div className='flex items-center gap-2 mb-3'>
            <XCircle className='h-5 w-5' />
            <h3 className='font-semibold'>Error</h3>
          </div>
          <p className='text-sm mb-4'>{error || setupError}</p>
          {retryInitialization && (
            <button
              onClick={retryInitialization}
              className='text-sm bg-red-100 dark:bg-red-800 px-3 py-1 rounded hover:bg-red-200 dark:hover:bg-red-700'
            >
              Retry Initialization
            </button>
          )}
        </div>
      </div>
    );
  }
  const getStepIcon = (stepIndex: number) => {
    if (stepIndex < currentStep) {
      return <CheckCircle className='h-5 w-5 text-green-500' />;
    } else if (stepIndex === currentStep) {
      return <Loader2 className='h-5 w-5 animate-spin text-blue-500' />;
    } else {
      return <div className='h-5 w-5 rounded-full border-2 border-gray-300' />;
    }
  };

  const getStepText = (stepIndex: number, label: string) => {
    const isActive = stepIndex === currentStep;
    const isComplete = stepIndex < currentStep;

    return <span className={`text-sm font-medium ${isComplete ? 'text-green-600' : isActive ? 'text-blue-600' : 'text-gray-500'}`}>{label}</span>;
  };

  return (
    <div className='h-full w-full flex flex-col'>
      {!previewUrl ? (
        <div className='h-full flex flex-col'>
          <div className='w-full max-w-md p-6 m-5 rounded-lg bg-white dark:bg-zinc-800 shadow-sm mx-auto'>
            <Progress value={(currentStep / totalSteps) * 100} className='h-2 mb-6' />

            <div className='space-y-4 mb-6'>
              <div className='flex items-center gap-3'>
                {getStepIcon(1)}
                {getStepText(1, 'Transforming template data')}
              </div>
              <div className='flex items-center gap-3'>
                {getStepIcon(2)}
                {getStepText(2, 'Mounting files')}
              </div>
              <div className='flex items-center gap-3'>
                {getStepIcon(3)}
                {getStepText(3, 'Installing dependencies')}
              </div>
              <div className='flex items-center gap-3'>
                {getStepIcon(4)}
                {getStepText(4, 'Starting development server')}
              </div>
            </div>
          </div>

          {/* Terminal */}
          <div className='flex-1 p-4'>
            <div className='h-full flex flex-col'>
              <div className='flex justify-between items-center mb-2'>
                <h3 className='text-sm font-medium text-gray-700 dark:text-gray-300'>Terminal</h3>
                {(isSetupComplete || serverProcessRef.current) && (
                  <button
                    onClick={stopServer}
                    title='Stop development server (Ctrl+C)'
                    className='text-sm bg-red-100 dark:bg-red-800 px-3 py-1 rounded hover:bg-red-200 dark:hover:bg-red-700 transition-colors'
                  >
                    🛑 Stop Server
                  </button>
                )}
              </div>
              <TerminalComponent ref={terminalRef} webContainerInstance={instance} theme='dark' className='flex-1' />
            </div>
          </div>
        </div>
      ) : (
        <div className='h-full flex flex-col'>
          <div className='flex-1'>
            <iframe src={previewUrl} className='w-full h-full border-none' title='WebContainer Preview' />
          </div>

          <div className='h-64 border-t'>
            <div className='h-full flex flex-col'>
              <div className='flex justify-between items-center p-2 border-b'>
                <h3 className='text-sm font-medium text-gray-700 dark:text-gray-300'>Terminal</h3>
                <button
                  onClick={stopServer}
                  title='Stop development server (Ctrl+C)'
                  className='text-sm bg-red-100 dark:bg-red-800 px-3 py-1 rounded hover:bg-red-200 dark:hover:bg-red-700 transition-colors'
                >
                  🛑 Stop Server
                </button>
              </div>
              <TerminalComponent ref={terminalRef} webContainerInstance={instance} theme='dark' className='flex-1' />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebContainerPreview;
