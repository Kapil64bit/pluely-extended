import { useEffect } from 'react';

interface ToastProps {
  id: string;
  message: string;
  onClose: (id: string) => void;
}

export const Toast = ({ id, message, onClose }: ToastProps) => {
  useEffect(() => {
    const t = setTimeout(() => onClose(id), 1800);
    return () => clearTimeout(t);
  }, [id, onClose]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded shadow">
      {message}
    </div>
  );
};
