import React, { useState, useRef, useCallback } from 'react';

interface ResizablePanelProps {
  children: React.ReactNode;
  direction: 'horizontal' | 'vertical';
  initialSize?: number;
  minSize?: number;
  maxSize?: number;
  className?: string;
}

const ResizablePanel: React.FC<ResizablePanelProps> = ({
  children,
  direction,
  initialSize = 50,
  minSize = 5,
  maxSize = 95,
  className = '',
}) => {
  const [size, setSize] = useState(initialSize);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !panelRef.current) return;

      const rect = panelRef.current.getBoundingClientRect();
      let newSize: number;

      if (direction === 'horizontal') {
        newSize = ((e.clientX - rect.left) / rect.width) * 100;
      } else {
        newSize = ((e.clientY - rect.top) / rect.height) * 100;
      }

      newSize = Math.max(minSize, Math.min(maxSize, newSize));
      setSize(newSize);
    },
    [isResizing, direction, minSize, maxSize]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={panelRef}
      className={`relative ${className}`}
      style={{
        display: 'flex',
        flexDirection: direction === 'horizontal' ? 'row' : 'column',
        height: '100%',
        width: '100%',
      }}
    >
      <div
        style={{
          [direction === 'horizontal' ? 'width' : 'height']: `${size}%`,
          overflow: 'hidden',
        }}
      >
        {Array.isArray(children) ? children[0] : children}
      </div>
      
      <div
        className={`bg-gray-600 hover:bg-gray-500 cursor-${
          direction === 'horizontal' ? 'col' : 'row'
        }-resize transition-colors ${
          isResizing ? 'bg-blue-500' : ''
        }`}
        style={{
          [direction === 'horizontal' ? 'width' : 'height']: '4px',
          flexShrink: 0,
        }}
        onMouseDown={handleMouseDown}
      />
      
      <div
        style={{
          [direction === 'horizontal' ? 'width' : 'height']: `${100 - size}%`,
          overflow: 'hidden',
        }}
      >
        {Array.isArray(children) ? children[1] : null}
      </div>
    </div>
  );
};

export default ResizablePanel;