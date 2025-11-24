import React, { useState } from 'react';
import { useClickOutside } from '../hooks/useDropdown';
import { ChevronDown } from 'lucide-react';

export interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
  }>;
  className?: string;
  menuClassName?: string;
  triggerClassName?: string;
  align?: 'left' | 'right' | 'center';
  offset?: number;
  width?: string;
}

/**
 * Reusable DropdownMenu component with click-outside handling
 * Provides consistent dropdown behavior across the application
 */
export const DropdownMenu = React.forwardRef<HTMLDivElement, DropdownMenuProps>(
  (
    {
      trigger,
      items,
      className = '',
      menuClassName = '',
      triggerClassName = '',
      align = 'left',
      offset = 0,
      width = 'w-48',
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useClickOutside<HTMLDivElement>(isOpen, () => setIsOpen(false), {
      ignoreSelectors: ['[data-dropdown-trigger]'],
    });

    const handleItemClick = (onClick: () => void) => {
      onClick();
      setIsOpen(false);
    };

    const alignmentClasses = {
      left: 'left-0',
      right: 'right-0',
      center: 'left-1/2 -translate-x-1/2',
    };

    return (
      <div className={`relative inline-block ${className}`} ref={ref}>
        <button
          data-dropdown-trigger
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3 py-2 rounded transition-colors hover:bg-gray-700 ${triggerClassName}`}
        >
          {trigger}
          <ChevronDown
            size={16}
            className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isOpen && (
          <div
            ref={menuRef}
            className={`absolute ${alignmentClasses[align]} ${width} mt-1 top-full z-50 bg-gray-800 border border-gray-700 rounded shadow-lg overflow-hidden ${menuClassName}`}
            style={{ marginTop: `${offset}px` }}
          >
            {items.map((item, index) => (
              <button
                key={index}
                onClick={() => item.onClick && handleItemClick(item.onClick)}
                disabled={item.disabled}
                className={`w-full px-4 py-2 flex items-center gap-2 text-left text-sm transition-colors ${
                  item.disabled
                    ? 'text-gray-600 cursor-not-allowed'
                    : 'text-gray-300 hover:bg-gray-700 active:bg-gray-600'
                } ${item.className || ''}`}
              >
                {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
);

DropdownMenu.displayName = 'DropdownMenu';

/**
 * Simple select dropdown component
 * For single-select lists with cleaner styling
 */
export interface SelectDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{
    value: string;
    label: string;
    disabled?: boolean;
  }>;
  label?: string;
  className?: string;
  placeholder?: string;
}

export const SelectDropdown = React.forwardRef<HTMLDivElement, SelectDropdownProps>(
  ({ value, onChange, options, label, className = '', placeholder }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useClickOutside<HTMLDivElement>(isOpen, () => setIsOpen(false));

    const selectedOption = options.find(opt => opt.value === value);

    return (
      <div className={`relative ${className}`} ref={ref}>
        {label && (
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {label}
          </label>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-left text-gray-300 hover:border-gray-600 transition-colors flex items-center justify-between ${
            isOpen ? 'border-blue-500' : ''
          }`}
        >
          <span>{selectedOption?.label || placeholder || 'Select...'}</span>
          <ChevronDown
            size={16}
            className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isOpen && (
          <div
            ref={menuRef}
            className="absolute left-0 right-0 mt-1 top-full z-50 bg-gray-800 border border-gray-700 rounded shadow-lg overflow-hidden max-h-60 overflow-y-auto"
          >
            {options.map((option, index) => (
              <button
                key={index}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                disabled={option.disabled}
                className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                  option.value === value
                    ? 'bg-blue-600 text-white'
                    : option.disabled
                      ? 'text-gray-600 cursor-not-allowed'
                      : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
);

SelectDropdown.displayName = 'SelectDropdown';
