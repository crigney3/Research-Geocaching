import './Achievement.css';
import ErrorIcon from '@mui/icons-material/Error';
import { useEffect, useState } from 'react';

const Achievement = 
({ 
    image, 
    title, 
    description, 
    current, 
    target, 
    difficulty
}) => {
    const [achievementColor, setAchievementColor] = useState("red");
    const [achievementIcon, setAchievementIcon] = useState(<ErrorIcon/>);

    const progressPercentage = Math.min((current / target) * 100, 100);

    useEffect(() => {
        if (difficulty === 0) {
            setAchievementColor('var(--bronze)');
        } else if (difficulty === 1) {
            setAchievementColor('var(--silver)');
        } else if (difficulty === 2) {
            setAchievementColor('var(--gold)');
        } else if (difficulty === 3) {
            setAchievementColor('var(--diamond)');
        } else {
            setAchievementColor("blue");
        }

        if (image != null) {
            setAchievementIcon(image);
        }
    }, []);
    
    return (
      <div className="achievement-card">
        <div 
          className="achievement-image"
          style={{ color: achievementColor }}
        >
          {achievementIcon}
        </div>

        <h4 className="achievement-title">
          {title}
        </h4>

        <p className="achievement-description">
          {description}
        </p>

        <div className="achievement-progress-bar">
          <div 
            className="achievement-progress-fill"
            style={{
              width: `${progressPercentage}%`,
            }} 
          />
        </div>
          
        <div className="achievement-progress-label">
          {current}/{target}
        </div>
      </div>
    );
};

export default Achievement;