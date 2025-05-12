import React, { useState, useRef, useEffect } from 'react';

export function Tooltip({ content, children, delay = 200 }) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef();

  const show = () => {
    timeoutRef.current = window.setTimeout(() => setVisible(true), delay);
  };

  const hide = () => {
    clearTimeout(timeoutRef.current);
    setVisible(false);
  };
  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  return (
    <div
      style={{ display: 'inline-block', position: 'relative' }}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            bottom: '-40px',
            left: '50%',
            transform: 'translateX(-60%)',
            marginBottom: 8,
            padding: '8px 10px',
            backgroundColor: '#f4f7f9',
            color: 'rgb(36, 69, 97)',
            fontSize: '12px',
            borderRadius: 4,
            whiteSpace: 'nowrap',
            zIndex: 1000,
            pointerEvents: 'none'
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
}
