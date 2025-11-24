import { useEffect, useRef } from 'react';

/**
 * Hook for managing dropdown menus with click-outside handling
 * Closes menu when clicking outside the menu container
 */
export function useClickOutside<T extends HTMLElement>(
  isOpen: boolean,
  onClose: () => void,
  options?: {
    ignoreSelectors?: string[];
    delay?: number;
  }
) {
  const menuRef = useRef<T>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Check if click is outside menu
      if (menuRef.current && !menuRef.current.contains(target)) {
        // Check ignored selectors
        const ignored = options?.ignoreSelectors || [];
        const isIgnored = ignored.some(selector => target.closest(selector));

        if (!isIgnored) {
          // Apply delay if specified
          if (options?.delay) {
            timeoutRef.current = setTimeout(onClose, options.delay);
          } else {
            onClose();
          }
        }
      }
    };

    // Use capture phase for better event handling
    document.addEventListener('mousedown', handleClickOutside, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isOpen, onClose, options?.delay, options?.ignoreSelectors]);

  return menuRef;
}

/**
 * Hook for managing keyboard navigation in dropdowns
 * Supports arrow keys, Enter, and Escape
 */
export function useDropdownKeyboard(
  isOpen: boolean,
  onClose: () => void,
  onItemSelect?: (index: number) => void,
  itemCount?: number
) {
  const selectedIndexRef = useRef(-1);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          onClose();
          break;

        case 'ArrowDown':
          event.preventDefault();
          if (itemCount) {
            selectedIndexRef.current = (selectedIndexRef.current + 1) % itemCount;
          }
          break;

        case 'ArrowUp':
          event.preventDefault();
          if (itemCount) {
            selectedIndexRef.current =
              (selectedIndexRef.current - 1 + itemCount) % itemCount;
          }
          break;

        case 'Enter':
          event.preventDefault();
          if (onItemSelect && selectedIndexRef.current >= 0) {
            onItemSelect(selectedIndexRef.current);
          }
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onItemSelect, itemCount]);

  return selectedIndexRef;
}

/**
 * Hook for managing multiple dropdowns with mutual exclusion
 * Only one dropdown can be open at a time
 */
export function useDropdownGroup() {
  const openMenuRef = useRef<string | null>(null);

  const toggleMenu = (menuId: string): boolean => {
    if (openMenuRef.current === menuId) {
      openMenuRef.current = null;
      return false;
    } else {
      openMenuRef.current = menuId;
      return true;
    }
  };

  const closeAllMenus = () => {
    openMenuRef.current = null;
  };

  const isMenuOpen = (menuId: string): boolean => {
    return openMenuRef.current === menuId;
  };

  return { toggleMenu, closeAllMenus, isMenuOpen, openMenuRef };
}
