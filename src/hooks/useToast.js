import { useState, useCallback } from 'react';

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const ToastContainer = () => (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 500,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          animation: 'slideIn 0.2s ease',
          background: t.type === 'success' ? '#D1FAE5' : '#FEE2E2',
          color: t.type === 'success' ? '#065F46' : '#991B1B',
          border: `1px solid ${t.type === 'success' ? '#6EE7B7' : '#FCA5A5'}`
        }}>
          {t.type === 'success' ? '✓' : '✕'} {t.message}
        </div>
      ))}
      <style>{`@keyframes slideIn { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </div>
  );

  return { toast, ToastContainer };
}
