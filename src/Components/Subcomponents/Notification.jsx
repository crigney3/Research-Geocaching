import { useState, useEffect } from 'react';
import './Notification.css';

const Firework = ({ x, y, delay, color }) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        width: '4px',
        height: '4px',
        backgroundColor: color,
        borderRadius: '50%',
        animation: `firework 1.2s ease-out ${delay}s forwards`,
        opacity: 0,
        zIndex: 1001
      }}
    />
  );
};

const Notification = ({ message, isVisible, onHide, index }) => {
  const [showFireworks, setShowFireworks] = useState(false);
  const [fireworkColors, setFireworkColors] = useState([]);

  useEffect(() => {
    if (isVisible) {
      // Show fireworks after notification slides down
      const fireworkTimer = setTimeout(() => {
        setShowFireworks(true);
      }, 300);

      // Hide fireworks
      const hideFireworksTimer = setTimeout(() => {
        setShowFireworks(false);
      }, 2000);

      // Auto-hide notification
      const hideTimer = setTimeout(() => {
        onHide(index);
      }, 3500);

      return () => {
        clearTimeout(fireworkTimer);
        clearTimeout(hideFireworksTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [isVisible, onHide, index]);

  useEffect(() => {
    let tempColors = [];

    for (let i = 0; i < 6; i++) {
        tempColors.push(`hsl(${360*Math.random()}deg, ${20+80*Math.random()}%, 50)`);
    }

    setFireworkColors(tempColors);
  }, []);

  return (
    <>
      {isVisible && (
        <div className='Notification' style={{top: `${20 + index * 80}px`}}>
          {message}
        </div>
      )}

      {showFireworks && isVisible && (
        <div style={{           
          position: 'fixed', 
          top: `${20 + index * 80}px`, 
          right: '20px',
          width: '300px', 
          height: '100px', 
          pointerEvents: 'none', 
          zIndex: 100001  }}>
          {/* Generate multiple fireworks */}
          {Array.from({ length: 12 }, (_, i) => (
            <Firework
              key={i}
              x={10 + (i % 4) * 25} // Spread across screen
              y={20 + Math.floor(i / 4) * 25} // Multiple rows
              delay={i * 0.1}
              color={fireworkColors[i % fireworkColors.length]}
            />
          ))}
          
          {/* Additional sparkles */}
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={`sparkle-${i}`}
              style={{
                position: 'absolute',
                left: `${30 + i * 12}%`,
                top: `${30 + (i % 2) * 15}%`,
                width: '6px',
                height: '6px',
                backgroundColor: fireworkColors[i % fireworkColors.length],
                borderRadius: '50%',
                animation: `sparkle 1s ease-in-out ${i * 0.15}s forwards`,
                zIndex: 1001
              }}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default Notification;