import { useState, useCallback } from 'react';

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type) => {
    const kind = type || 'success';
    const id = Date.now();
    setToasts(function(prev) { return [...prev, { id: id, message: message, type: kind }]; });
    setTimeout(function() {
      setToasts(function(prev) { return prev.filter(function(t) { return t.id !== id; }); });
    }, 3500);
  }, []);

  const ToastContainer = function() {
    return (
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map(function(t) {
          var isSuccess = t.type === 'success';
          var bg = isSuccess ? '#D1FAE5' : '#FEE2E2';
          var color = isSuccess ? '#065F46' : '#991B1B';
          var border = isSuccess ? '1px solid #6EE7B7' : '1px solid #FCA5A5';
          var prefix = isSuccess ? 'Done: ' : 'Error: ';
          return (
            <div key={t.id} style={{
              padding: '10px 16px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 500,
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              background: bg,
              color: color,
              border: border
            }}>
              {prefix}{t.message}
            </div>
          );
        })}
      </div>
    );
  };

  return { toast: toast, ToastContainer: ToastContainer };
}
