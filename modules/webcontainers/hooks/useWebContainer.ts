import { TemplateFolder } from '@/modules/playground/lib/path-to-json';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseWebContainerProps {
  templateData: TemplateFolder;
}

interface UseWebContaierReturn {
  serverUrl: string | null;
  isLoading: boolean;
  error: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  instance: any;
  writeFileSync: (path: string, content: string) => Promise<void>;
  destory: () => void;
  retryCount: number;
  isRetrying: boolean;
  retryInitialization: () => void;
  refreshWebContainer: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const useWebContainer = ({ templateData: _templateData }: UseWebContainerProps): UseWebContaierReturn => {
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  // Use useRef for WebContainer instance management
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const instanceRef = useRef<any>(null);
  const initPromiseRef = useRef<Promise<any> | null>(null);
  const isInitializingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    let mounted = true;

    async function initializeWebContainer() {
      console.group('🚀 WebContainer Initialization Flow');

      console.log('1️⃣ Initialization Check:', {
        isRetrying: retryCount > 0,
        retryAttempt: retryCount + 1,
        isClientSide: typeof window !== 'undefined',
        mounted: mounted,
      });

      try {
        setIsRetrying(retryCount > 0);

        console.log('2️⃣ ✅ PROCEEDING: Starting WebContainer initialization');

        // Dynamically import WebContainer only on client side
        if (typeof window === 'undefined') {
          console.log('2️⃣ ❌ BLOCKED: Not client-side, skipping initialization');
          console.groupEnd();
          return;
        }

        // Check if there's already a global initialization promise
        if ((window as any).__webcontainerInitPromise) {
          console.log('3️⃣ ℹ️ WebContainer initialization already in progress, waiting...');
          try {
            const existingInstance = await (window as any).__webcontainerInitPromise;
            if (mounted && existingInstance) {
              console.log('3️⃣ ✅ SUCCESS: Using existing WebContainer instance');
              instanceRef.current = existingInstance;
              setIsLoading(false);
              setIsRetrying(false);
              setError(null);
              setRetryCount(0);
            }
            console.groupEnd();
            return;
          } catch (error) {
            console.log('3️⃣ ⚠️ Existing initialization failed, proceeding with new one');
          }
        }

        // Check if there's already a WebContainer instance
        if ((window as any).__webcontainerInstance) {
          console.log('3️⃣ ℹ️ Using existing WebContainer instance');
          instanceRef.current = (window as any).__webcontainerInstance;
          setIsLoading(false);
          setIsRetrying(false);
          setError(null);
          setRetryCount(0);
          console.groupEnd();
          return;
        }

        console.log('3️⃣ 📦 Loading WebContainer API...');
        const { WebContainer } = await import('@webcontainer/api');

        console.log('3️⃣ ✅ SUCCESS: WebContainer API loaded');

        // Check if there's already a global initialization promise
        if ((window as any).__webcontainerInitPromise) {
          console.log('3️⃣ ℹ️ WebContainer initialization already in progress, waiting...');
          try {
            const existingInstance = await (window as any).__webcontainerInitPromise;
            if (mounted && existingInstance) {
              console.log('3️⃣ ✅ SUCCESS: Using existing WebContainer instance');
              instanceRef.current = existingInstance;
              setIsLoading(false);
              setIsRetrying(false);
              setError(null);
              setRetryCount(0);
            }
            console.groupEnd();
            return;
          } catch (error) {
            console.log('3️⃣ ⚠️ Existing initialization failed, proceeding with new one');
          }
        }

        // Check if there's already a WebContainer instance
        if ((window as any).__webcontainerInstance) {
          console.log('3️⃣ ℹ️ Using existing WebContainer instance');
          instanceRef.current = (window as any).__webcontainerInstance;
          setIsLoading(false);
          setIsRetrying(false);
          setError(null);
          setRetryCount(0);
          console.groupEnd();
          return;
        }

        console.log('4️⃣ 🔧 Booting WebContainer...');

        // Get the webcontainer instance (either from successful boot or existing instance)
        let webcontainerInstance;
        try {
          const initPromise = WebContainer.boot();
          (window as any).__webcontainerInitPromise = initPromise;
          webcontainerInstance = await initPromise;

          console.log('4️⃣ ✅ SUCCESS: WebContainer booted successfully');

          // Store the instance globally to prevent multiple instances
          (window as any).__webcontainerInstance = webcontainerInstance;
          (window as any).__webcontainerInitPromise = null; // Clear the promise
        } catch (bootError) {
          // Clear the promise on error
          (window as any).__webcontainerInitPromise = null;

          // Check if it's the "single instance" error
          if (bootError instanceof Error && bootError.message.includes('Only a single WebContainer instance can be booted')) {
            console.log('4️⃣ ℹ️ WebContainer already booted, using global instance...');

            // Use the global instance if it exists
            if ((window as any).__webcontainerInstance) {
              webcontainerInstance = (window as any).__webcontainerInstance;

              console.log('4️⃣ ✅ SUCCESS: Using existing global WebContainer instance');
            } else {
              console.log('4️⃣ ⚠️ No global instance found, this may be a real error');
              throw bootError; // Re-throw the original error
            }
          } else {
            // It's a different error, re-throw it
            throw bootError;
          }
        }

        console.log('5️⃣ 🔍 Checking mount status:', {
          mounted: mounted,
          hasInstance: !!webcontainerInstance,
        });

        if (!mounted) {
          console.log('5️⃣ ❌ BLOCKED: Component unmounted during initialization');
          console.groupEnd();
          return;
        }

        console.log('6️⃣ ✅ PROCEEDING: Setting WebContainer instance');
        instanceRef.current = webcontainerInstance;
        setIsLoading(false);
        setError(null);
        setRetryCount(0);
        setIsRetrying(false);

        console.log('7️⃣ ✅ SUCCESS: WebContainer initialization completed', {
          retryCount: 0,
          isLoading: false,
          error: null,
          isRetrying: false,
        });
        console.groupEnd();
      } catch (error) {
        console.error('❌ ERROR: Failed to initialize WebContainer:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to initialize WebContainer';

        console.log('8️⃣ ❌ FAILED: WebContainer initialization error', {
          errorMessage: errorMessage,
          retryCount: retryCount,
          maxRetries: 3,
        });

        // Clear the global promise on error
        (window as any).__webcontainerInitPromise = null;

        if (mounted) {
          setError(errorMessage);
          setIsLoading(false);
          setIsRetrying(false);

          // Auto-retry up to 3 times with exponential backoff
          if (retryCount < 3) {
            const delay = Math.pow(2, retryCount) * 2000; // 2s, 4s, 8s

            console.log(`9️⃣ 🔄 RETRY: Retrying WebContainer initialization in ${delay}ms... (attempt ${retryCount + 1}/3)`);
            setTimeout(() => {
              if (mounted) {
                setRetryCount(prev => prev + 1);
              }
            }, delay);
          } else {
            console.log('9️⃣ ❌ FAILED: Maximum retry attempts reached');
          }
        } else {
          console.log('8️⃣ ℹ️ Component unmounted, skipping error handling');
        }
        console.groupEnd();
      }
    }

    initializeWebContainer();

    return () => {
      console.log('🧹 CLEANUP: WebContainer useEffect cleanup');
      mounted = false;
      // Don't teardown the global instance here, let it persist across component unmounts
      // The global instance will be cleaned up when the page is refreshed or closed
    };
  }, [retryCount]);

  const writeFileSync = useCallback(
    async (path: string, content: string): Promise<void> => {
      console.group('📝 WebContainer File Write Flow');

      console.log('1️⃣ Write Request:', {
        filePath: path,
        contentLength: content.length,
        hasInstance: !!instanceRef.current,
      });

      if (!instanceRef.current) {
        console.log('1️⃣ ❌ BLOCKED: WebContainer instance is not available');
        console.groupEnd();
        throw new Error('WebContainer instance is not available');
      }

      // Validate and sanitize path
      if (!path || typeof path !== 'string') {
        console.log('1️⃣ ❌ BLOCKED: Invalid file path');
        console.groupEnd();
        throw new Error('Invalid file path provided');
      }

      // Sanitize path to prevent illegal characters
      const sanitizedPath = path
        .replace(/[<>:"|?*]/g, '') // Remove illegal characters
        .replace(/\.\./g, '') // Remove parent directory references
        .replace(/^\/+/, '') // Remove leading slashes
        .replace(/\/+/g, '/'); // Replace multiple slashes with single slash

      if (!sanitizedPath) {
        console.log('1️⃣ ❌ BLOCKED: Path became empty after sanitization');
        console.groupEnd();
        throw new Error('Invalid file path after sanitization');
      }

      try {
        console.log('2️⃣ 🔍 Parsing file path:', {
          originalPath: path,
          sanitizedPath: sanitizedPath,
          pathParts: sanitizedPath.split('/'),
        });

        const pathParts = sanitizedPath.split('/');
        const folderPath = pathParts.slice(0, -1).join('/');

        if (folderPath) {
          console.log('3️⃣ 📁 Creating directory structure:', {
            folderPath: folderPath,
            recursive: true,
          });
          await instanceRef.current.fs.mkdir(folderPath, { recursive: true }); // Create folder structure recursively

          console.log('3️⃣ ✅ SUCCESS: Directory structure created');
        } else {
          console.log('3️⃣ ℹ️ No directory structure needed (root file)');
        }

        console.log('4️⃣ 📝 Writing file content:', {
          filePath: sanitizedPath,
          contentLength: content.length,
          contentPreview: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
        });
        await instanceRef.current.fs.writeFile(sanitizedPath, content);

        console.log('5️⃣ ✅ SUCCESS: File written successfully');
        console.groupEnd();
      } catch (err) {
        console.error('❌ ERROR: Failed to write file:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to write file';

        console.log('5️⃣ ❌ FAILED: File write error', {
          errorMessage: errorMessage,
          originalPath: path,
          sanitizedPath: sanitizedPath,
        });
        console.groupEnd();
        throw new Error(`Failed to write file at ${path}: ${errorMessage}`);
      }
    },
    [instanceRef.current]
  );

  const destory = useCallback(() => {
    console.group('🗑️ WebContainer Destroy Flow');

    console.log('1️⃣ Destroy Request:', {
      hasInstance: !!instanceRef.current,
      hasServerUrl: !!serverUrl,
      hasGlobalInstance: !!(window as any).__webcontainerInstance,
    });

    if (instanceRef.current) {
      console.log('2️⃣ 🧹 CLEANUP: Tearing down WebContainer instance');
      try {
        instanceRef.current.teardown();

        console.log('2️⃣ ✅ SUCCESS: WebContainer instance torn down');
      } catch (error) {
        console.log('2️⃣ ⚠️ WARNING: Error during teardown (instance may already be torn down):', error);
      }
    } else {
      console.log('2️⃣ ℹ️ No instance to destroy');
    }

    // Clear the global instance reference and promise
    if ((window as any).__webcontainerInstance) {
      console.log('3️⃣ 🧹 Clearing global WebContainer instance reference');
      (window as any).__webcontainerInstance = null;
    }
    if ((window as any).__webcontainerInitPromise) {
      console.log('3️⃣ 🧹 Clearing global WebContainer init promise');
      (window as any).__webcontainerInitPromise = null;
    }

    instanceRef.current = null;
    setServerUrl(null);
    setIsLoading(false);
    setError(null);
    setRetryCount(0);
    setIsRetrying(false);

    console.log('4️⃣ ✅ SUCCESS: WebContainer destroyed successfully');
    console.groupEnd();
  }, [instanceRef.current, serverUrl]);

  const retryInitialization = useCallback(() => {
    console.group('🔄 WebContainer Manual Retry Flow');

    console.log('1️⃣ Manual Retry Request:', {
      hasInstance: !!instanceRef.current,
      currentRetryCount: retryCount,
      currentError: error,
    });

    console.log('2️⃣ 🧹 CLEANUP: Resetting state and cleaning up');
    setRetryCount(0);
    setError(null);
    setIsLoading(true);
    setIsRetrying(false);

    // Clear global promise and instance
    (window as any).__webcontainerInitPromise = null;
    (window as any).__webcontainerInstance = null;

    // Clean up existing instance
    if (instanceRef.current) {
      console.log('3️⃣ 🗑️ Destroying existing instance');
      try {
        instanceRef.current.teardown();
      } catch (error) {
        console.log('3️⃣ ⚠️ Error during teardown (instance may already be torn down):', error);
      }
      instanceRef.current = null;
    } else {
      console.log('3️⃣ ℹ️ No existing instance to destroy');
    }
    setServerUrl(null);

    console.log('4️⃣ ✅ SUCCESS: Manual retry initiated');
    console.groupEnd();
  }, [instanceRef.current, retryCount, error]);

  const refreshWebContainer = useCallback(() => {
    console.group('🔄 WebContainer Refresh Flow');

    console.log('1️⃣ Refresh Request:', {
      hasInstance: !!instanceRef.current,
      hasGlobalInstance: !!(window as any).__webcontainerInstance,
      hasGlobalPromise: !!(window as any).__webcontainerInitPromise,
    });

    console.log('2️⃣ 🧹 CLEANUP: Clearing all WebContainer state');

    // Clear all global references
    (window as any).__webcontainerInstance = null;
    (window as any).__webcontainerInitPromise = null;

    // Reset all local state
    instanceRef.current = null;
    setServerUrl(null);
    setIsLoading(false);
    setError(null);
    setRetryCount(0);
    setIsRetrying(false);

    console.log('3️⃣ 🔄 REFRESH: Forcing complete WebContainer reset');

    // Force a complete refresh by triggering a new initialization
    setTimeout(() => {
      console.log('4️⃣ 🚀 Starting fresh WebContainer initialization');
      setRetryCount(0);
      setIsLoading(true);
    }, 100);

    console.log('5️⃣ ✅ SUCCESS: WebContainer refresh initiated');
    console.groupEnd();
  }, [instanceRef.current]);

  // Add global cleanup on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if ((window as any).__webcontainerInstance) {
        console.log('🧹 GLOBAL CLEANUP: Tearing down WebContainer on page unload');
        try {
          (window as any).__webcontainerInstance.teardown();
        } catch (error) {
          console.log('⚠️ GLOBAL CLEANUP: Error during teardown:', error);
        }
        (window as any).__webcontainerInstance = null;
      }
      if ((window as any).__webcontainerInitPromise) {
        console.log('🧹 GLOBAL CLEANUP: Clearing WebContainer init promise');
        (window as any).__webcontainerInitPromise = null;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return {
    serverUrl,
    isLoading,
    error,
    instance: instanceRef.current,
    writeFileSync,
    destory,
    retryCount,
    isRetrying,
    retryInitialization,
    refreshWebContainer,
  };
};
