import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Custom hook to refresh data when page becomes visible or when navigating back
 * This ensures pages show updated data after returning from other pages
 */
export function usePageRefresh(refreshCallback: () => void | Promise<void>, dependencies: any[] = []) {
  const pathname = usePathname();
  const previousPathname = useRef<string | null>(null);
  const previousDeps = useRef<any[]>(dependencies);
  const callbackRef = useRef(refreshCallback);
  const isMounted = useRef(false);

  // Always keep the callback ref updated - this ensures we always have the latest version
  useEffect(() => {
    callbackRef.current = refreshCallback;
  }, [refreshCallback]);

  // Helper to execute callback safely
  const executeCallback = () => {
    if (!isMounted.current) return;
    
    try {
      const result = callbackRef.current();
      if (result instanceof Promise) {
        result.catch(error => {
          // Only log network errors, don't show them to user
          if (error?.message && !error.message.includes('Failed to fetch')) {
            console.error('[usePageRefresh] Error in refresh callback:', error);
          }
        });
      }
    } catch (error) {
      // Only log non-network errors
      if (error instanceof Error && !error.message.includes('Failed to fetch')) {
        console.error('[usePageRefresh] Error executing refresh callback:', error);
      }
    }
  };

  // CRITICAL: Always run on mount
  useEffect(() => {
    isMounted.current = true;
    
    // Execute immediately
    executeCallback();
    
    // Check for refresh flag
    const refreshFlag = sessionStorage.getItem(`refresh_${pathname}`);
    if (refreshFlag === 'true') {
      sessionStorage.removeItem(`refresh_${pathname}`);
      // Delayed refresh to ensure component is ready
      setTimeout(executeCallback, 150);
    }
    
    return () => {
      isMounted.current = false;
    };
  }, []); // Only on mount

  // Refresh when pathname changes (navigation)
  useEffect(() => {
    if (previousPathname.current === null) {
      previousPathname.current = pathname;
      return;
    }

    if (previousPathname.current !== pathname) {
      previousPathname.current = pathname;
      
      // Check for refresh flag
      const refreshFlag = sessionStorage.getItem(`refresh_${pathname}`);
      if (refreshFlag === 'true') {
        sessionStorage.removeItem(`refresh_${pathname}`);
      }
      
      // Always refresh on navigation (with delay for Next.js to finish)
      const timer1 = setTimeout(executeCallback, 250);
      // If there was a flag, refresh again after a bit more time
      if (refreshFlag === 'true') {
        const timer2 = setTimeout(executeCallback, 500);
        return () => {
          clearTimeout(timer1);
          clearTimeout(timer2);
        };
      }
      return () => clearTimeout(timer1);
    }
  }, [pathname]);

  // Refresh when dependencies change
  useEffect(() => {
    const depsChanged = 
      dependencies.length !== previousDeps.current.length ||
      dependencies.some((dep, index) => dep !== previousDeps.current[index]);

    if (depsChanged && isMounted.current) {
      executeCallback();
    }

    previousDeps.current = dependencies;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  // Refresh when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isMounted.current) {
        executeCallback();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Refresh when window gains focus
  useEffect(() => {
    const handleFocus = () => {
      if (isMounted.current) {
        executeCallback();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Listen for custom refresh events
  useEffect(() => {
    const handleRefresh = (event: Event) => {
      const customEvent = event as CustomEvent<string | undefined>;
      const targetPath = customEvent.detail;
      
      // Refresh if no target specified or if target matches current path
      if ((!targetPath || targetPath === pathname) && isMounted.current) {
        executeCallback();
      }
    };

    window.addEventListener('pageRefresh', handleRefresh as EventListener);
    return () => window.removeEventListener('pageRefresh', handleRefresh as EventListener);
  }, [pathname]);
}

/**
 * Utility function to trigger a page refresh event
 */
export function triggerPageRefresh(targetPath?: string) {
  if (targetPath) {
    sessionStorage.setItem(`refresh_${targetPath}`, 'true');
  }
  window.dispatchEvent(new CustomEvent('pageRefresh', { detail: targetPath }));
}
