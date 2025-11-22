import { X, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import React from 'react';

/**
 * Reusable Modal Header Component
 */
export function ModalHeader({
  title,
  onClose,
  subtitle,
}: {
  title: string;
  onClose: () => void;
  subtitle?: string;
}) {
  return (
    <div className="sticky top-0 bg-gray-900 border-b border-gray-700 flex items-center justify-between p-6">
      <div className="flex-1">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
      <button
        onClick={onClose}
        className="p-1 hover:bg-gray-800 rounded-lg transition-colors"
        aria-label="Close modal"
      >
        <X className="w-5 h-5 text-gray-400" />
      </button>
    </div>
  );
}

/**
 * Reusable Modal Footer with consistent styling
 */
export function ModalFooter({
  onCancel,
  onConfirm,
  cancelText = 'Cancel',
  confirmText = 'Confirm',
  isLoading = false,
  confirmVariant = 'blue',
}: {
  onCancel: () => void;
  onConfirm: () => void;
  cancelText?: string;
  confirmText?: string;
  isLoading?: boolean;
  confirmVariant?: 'blue' | 'green' | 'red';
}) {
  const confirmColors = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700',
    red: 'bg-red-600 hover:bg-red-700',
  };

  return (
    <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 flex justify-end gap-3 p-6">
      <button
        onClick={onCancel}
        disabled={isLoading}
        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-100 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {cancelText}
      </button>
      <button
        onClick={onConfirm}
        disabled={isLoading}
        className={`px-4 py-2 ${confirmColors[confirmVariant]} text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
      >
        {isLoading && <Loader className="w-4 h-4 animate-spin" />}
        {confirmText}
      </button>
    </div>
  );
}

/**
 * Reusable Error Message Component
 */
export function ErrorMessage({ message, title = 'Error' }: { message: string; title?: string }) {
  return (
    <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-red-300">{title}</p>
          <p className="text-xs text-red-400 mt-1">{message}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Reusable Success Message Component
 */
export function SuccessMessage({ message, title = 'Success' }: { message: string; title?: string }) {
  return (
    <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-green-300">{title}</p>
          <p className="text-xs text-green-400 mt-1">{message}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Reusable Form Field Component
 */
export function FormField({
  label,
  error,
  required = false,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

/**
 * Reusable Loading Spinner
 */
export function LoadingSpinner({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-3">
      <Loader className="w-6 h-6 text-blue-400 animate-spin" />
      <p className="text-sm text-gray-300">{text}</p>
    </div>
  );
}

/**
 * Reusable Info Box
 */
export function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg space-y-2">
      <p className="text-xs text-blue-200">{children}</p>
    </div>
  );
}
