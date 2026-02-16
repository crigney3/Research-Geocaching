import './Achievement.css';
import ErrorIcon from '@mui/icons-material/Error';
import { useEffect, useState } from 'react';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

const Achievement = 
({ 
    image, 
    title, 
    description, 
    current, 
    target, 
    difficulty,
    completed
}) => {
    const [achievementColor, setAchievementColor] = useState("red");
    const [achievementIcon, setAchievementIcon] = useState(<ErrorIcon/>);
    const [difficultyClass, setDifficultyClass] = useState("");
    
    const progressPercentage = Math.min((current / target) * 100, 100);
    
    useEffect(() => {
        if (difficulty === 0) {
            setAchievementColor('var(--bronze)');
            setDifficultyClass('bronze');
        } else if (difficulty === 1) {
            setAchievementColor('var(--silver)');
            setDifficultyClass('silver');
        } else if (difficulty === 2) {
            setAchievementColor('var(--gold)');
            setDifficultyClass('gold');
        } else if (difficulty === 3) {
            setAchievementColor('var(--diamond)');
            setDifficultyClass('diamond');
        } else {
            setAchievementColor("blue");
            setDifficultyClass('default');
        }
        
        if (image != null) {
            setAchievementIcon(image);
        }
    }, [difficulty, image]);
    
    return (
        <div className={`achievement-card ${completed ? `completed ${difficultyClass}` : ''}`}>
            {completed && (
                <div className={`achievement-trophy ${difficultyClass}`}>
                    <EmojiEventsIcon />
                </div>
            )}
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
                        background: `linear-gradient(90deg, #F68B1F 0%, ${achievementColor} 30%)`
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