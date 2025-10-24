import { TemplateFolder } from '@/modules/playground/lib/path-to-json';
import { useCallback, useEffect, useState } from 'react';

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
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const useWebContainer = ({ templateData: _templateData }: UseWebContainerProps): UseWebContaierReturn => {
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [instance, setInstance] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

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

        console.log('3️⃣ 📦 Loading WebContainer API...');
        const { WebContainer } = await import('@webcontainer/api');
        console.log('3️⃣ ✅ SUCCESS: WebContainer API loaded');

        console.log('4️⃣ 🔧 Booting WebContainer...');
        const webcontainerInstance = await WebContainer.boot();
        console.log('4️⃣ ✅ SUCCESS: WebContainer booted successfully');

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
        setInstance(webcontainerInstance);
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
      if (instance) {
        console.log('🧹 CLEANUP: Tearing down WebContainer instance');
        instance.teardown();
      }
    };
  }, [retryCount, instance]);

  const writeFileSync = useCallback(
    async (path: string, content: string): Promise<void> => {
      console.group('📝 WebContainer File Write Flow');
      console.log('1️⃣ Write Request:', {
        filePath: path,
        contentLength: content.length,
        hasInstance: !!instance,
      });

      if (!instance) {
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
          await instance.fs.mkdir(folderPath, { recursive: true }); // Create folder structure recursively
          console.log('3️⃣ ✅ SUCCESS: Directory structure created');
        } else {
          console.log('3️⃣ ℹ️ No directory structure needed (root file)');
        }

        console.log('4️⃣ 📝 Writing file content:', {
          filePath: sanitizedPath,
          contentLength: content.length,
          contentPreview: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
        });
        await instance.fs.writeFile(sanitizedPath, content);
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
    [instance]
  );

  const destory = useCallback(() => {
    console.group('🗑️ WebContainer Destroy Flow');
    console.log('1️⃣ Destroy Request:', {
      hasInstance: !!instance,
      hasServerUrl: !!serverUrl,
    });

    if (instance) {
      console.log('2️⃣ 🧹 CLEANUP: Tearing down WebContainer instance');
      instance.teardown();
      setInstance(null);
      setServerUrl(null);
      console.log('3️⃣ ✅ SUCCESS: WebContainer destroyed successfully');
    } else {
      console.log('2️⃣ ℹ️ No instance to destroy');
    }
    console.groupEnd();
  }, [instance, serverUrl]);

  const retryInitialization = useCallback(() => {
    console.group('🔄 WebContainer Manual Retry Flow');
    console.log('1️⃣ Manual Retry Request:', {
      hasInstance: !!instance,
      currentRetryCount: retryCount,
      currentError: error,
    });

    console.log('2️⃣ 🧹 CLEANUP: Resetting state and cleaning up');
    setRetryCount(0);
    setError(null);
    setIsLoading(true);
    setIsRetrying(false);

    // Clean up existing instance
    if (instance) {
      console.log('3️⃣ 🗑️ Destroying existing instance');
      instance.teardown();
      setInstance(null);
    } else {
      console.log('3️⃣ ℹ️ No existing instance to destroy');
    }
    setServerUrl(null);
    console.log('4️⃣ ✅ SUCCESS: Manual retry initiated');
    console.groupEnd();
  }, [instance, retryCount, error]);

  return {
    serverUrl,
    isLoading,
    error,
    instance,
    writeFileSync,
    destory,
    retryCount,
    isRetrying,
    retryInitialization,
  };
};
