import { useState, useCallback } from 'react';

interface ConfirmationOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

interface ConfirmationState extends ConfirmationOptions {
  isOpen: boolean;
  onConfirm: () => void;
}

export const useConfirmation = () => {
  const [confirmationState, setConfirmationState] = useState<ConfirmationState>({
    isOpen: false,
    message: '',
    onConfirm: () => {}
  });

  const showConfirmation = useCallback((
    options: ConfirmationOptions,
    onConfirm: () => void
  ) => {
    setConfirmationState({
      ...options,
      isOpen: true,
      onConfirm
    });
  }, []);

  const hideConfirmation = useCallback(() => {
    setConfirmationState(prev => ({
      ...prev,
      isOpen: false
    }));
  }, []);

  const handleConfirm = useCallback(() => {
    confirmationState.onConfirm();
    hideConfirmation();
  }, [confirmationState.onConfirm, hideConfirmation]);

  return {
    confirmationState,
    showConfirmation,
    hideConfirmation,
    handleConfirm
  };
};