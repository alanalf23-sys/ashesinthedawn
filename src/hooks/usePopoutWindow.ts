/**
 * PopoutWindow Hook
 * Manages opening FXBrowser or other components in a separate window
 * Handles window lifecycle, state sync, and cross-window communication
 */

import { useEffect, useRef, useState } from 'react';

export interface PopoutWindowOptions {
  title?: string;
  width?: number;
  height?: number;
  left?: number;
  top?: number;
}

interface PopoutWindowState {
  isOpen: boolean;
  windowRef: Window | null;
}

/**
 * Hook to manage a popout window
 * @param componentName Name of component to display in popout
 * @param options Window options (size, position, title)
 * @returns State and handlers for popout window
 */
export function usePopoutWindow(
  componentName: string,
  options: PopoutWindowOptions = {}
) {
  const [state, setState] = useState({
    isOpen: false,
    windowRef: null as Window | null,
  });

  const defaultOptions: PopoutWindowOptions = {
    title: `${componentName} - CoreLogic Studio`,
    width: 600,
    height: 800,
    left: window.screenX + 100,
    top: window.screenY + 100,
    ...options,
  };

  /**
   * Open a new window with the component
   */
  const openPopout = () => {
    if (state.windowRef && !state.windowRef.closed) {
      // Window already open, focus it
      state.windowRef.focus();
      return;
    }

    const windowFeatures = [
      `width=${defaultOptions.width}`,
      `height=${defaultOptions.height}`,
      `left=${defaultOptions.left}`,
      `top=${defaultOptions.top}`,
      'resizable=yes',
      'scrollbars=yes',
      'status=no',
      'menubar=no',
      'toolbar=no',
      'location=no',
    ].join(',');

    const newWindow = window.open(
      `/popout/${componentName.toLowerCase()}`,
      `${componentName}-popout-${Date.now()}`,
      windowFeatures
    );

    if (newWindow) {
      // Set title
      newWindow.document.title = defaultOptions.title!;

      // Track window reference
      setState({
        isOpen: true,
        windowRef: newWindow,
      });

      // Listen for window close
      const closeListener = setInterval(() => {
        if (newWindow.closed) {
          setState({
            isOpen: false,
            windowRef: null,
          });
          clearInterval(closeListener);
        }
      }, 500);
    } else {
      console.warn('Failed to open popout window. Popups may be blocked.');
    }
  };

  /**
   * Close the popout window
   */
  const closePopout = () => {
    if (state.windowRef && !state.windowRef.closed) {
      state.windowRef.close();
    }
    setState({
      isOpen: false,
      windowRef: null,
    });
  };

  /**
   * Send message to popout window
   */
  const sendMessage = (message: any) => {
    if (state.windowRef && !state.windowRef.closed) {
      state.windowRef.postMessage(message, window.location.origin);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.windowRef && !state.windowRef.closed) {
        state.windowRef.close();
      }
    };
  }, [state.windowRef]);

  return {
    isOpen: state.isOpen,
    windowRef: state.windowRef,
    openPopout,
    closePopout,
    sendMessage,
  };
}

/**
 * Hook to handle messages from parent window in popout
 */
export function usePopoutParentMessage(onMessage: (message: any) => void) {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== window.location.origin) return;
      onMessage(event.data);
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onMessage]);
}

/**
 * Hook to detect if running in popout window
 */
export function useIsPopoutWindow(): boolean {
  return window.opener !== null || window.self !== window.top;
}
