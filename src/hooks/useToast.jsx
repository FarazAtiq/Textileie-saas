import { useState, useCallback } from 'react';

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type) => {
    const kind = type || 'success';
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type: kind }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const ToastContainer = () => {
    return (
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map(t => (
          <div
            key={t.id}
            style={{
              padding: '10px 16px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 500,
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              background: t.type === 'success' ? '#D1FAE5' : '#FEE2E2',
              color: t.type === 'success' ? '#065F46' : '#991B1B',
              border: t.type === 'success' ? '1px solid #6EE7B7' : '1px solid #FCA5A5'
            }}
          >
            {t.type === 'success' ? 'Done: ' : 'Error: '}{t.message}
          </div>
        ))}
      </div>
    );
  };

  return { toast, ToastContainer };
}
