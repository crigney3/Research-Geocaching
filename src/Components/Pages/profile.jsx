import { useContext, useEffect, useState } from 'react';
import './profile.css';
import { ResearchContext } from '../ResearchContext';
import Achievement from '../Subcomponents/Achievement';
import { BACKEND_URL, CLIENT_AUTH_SECRET } from '../../secrets';
import { InputModal } from '../Subcomponents/Modal';
import achievements from '../../AchievementData';

function sanitizeColumnName(title) {
  // Remove all non-alphanumeric characters (keeps only letters and numbers)
  let sanitized = title.replace(/[^a-zA-Z0-9]/g, '');
  
  // Ensure it starts with a letter (MySQL requirement)
  if (!/^[a-zA-Z]/.test(sanitized)) {
    sanitized = 'achievement_' + sanitized;
  }
  
  // Limit length to 64 characters (MySQL column name limit)
  if (sanitized.length > 64) {
    sanitized = sanitized.substring(0, 64);
  }
  
  return sanitized;
}

const ProfilePage = ({

}) => {
  const currentUser = useContext(ResearchContext).currentUser;
  const reloadUser = useContext(ResearchContext).checkForExistingUser;
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [isUserLoaded, setIsUserLoaded] = useState(false);

  useEffect(() => {
    if (currentUser != null && currentUser.achievementKeys != null) {
      setIsUserLoaded(true);
      convertAchievementData();
    }
  }, [currentUser]);

  if(currentUser === null) {
    return null;
  }

  const convertAchievementData = () => {
    achievements.forEach((achievement) => {
      if (achievement.statBase === "level") {
        achievement.current = currentUser.level;
      } else if (achievement.statBase === "factsViewed") {
        achievement.current = currentUser.factsViewed;
      } else if (achievement.statBase === "daysUsed") {
        achievement.current = currentUser.daysUsed;
      } else if (achievement.statBase === "factsPlaced") {
        achievement.current = currentUser.factsPlaced;
      }
      achievement.completed = currentUser.achievementKeys[sanitizeColumnName(achievement.title)];
    })
  }

  const getPermissionString = (permLevel) => {
    switch (permLevel) {
      case 0: return 'student';
      case 1: return 'professor';
      case 2: return 'administrator';
      case 3: return 'dev';
      default: return 'user';
    }
  };

  // Calculate level progress
  const xpPerLevel = Math.round(50 * Math.pow(1.15, currentUser.level));
  const currentLevelXP = currentUser.xp % xpPerLevel;
  const levelProgress = (currentLevelXP / xpPerLevel) * 100;

  const handleNewUsername = (newName) => {
    fetch(BACKEND_URL + "/change_username", {
        method: 'POST',
        headers: {
          'Authorization': `Bearer: ${CLIENT_AUTH_SECRET}`,
          'Content-Type': 'application/json;charset=utf-8'
        },
        mode: 'cors',
        body: JSON.stringify({id: currentUser.id, username: newName})
    }).then(response => {
        if (response.ok) {
          reloadUser();
        } else {
          throw new Error("Request to change username failed!");
        }
    }).catch(error => {
      console.error('Error: ', error);
      return;
    } );   

    setShowUsernameModal(false);
  }

  return (
    <div className="profile-container">
      <InputModal
        show={showUsernameModal}
        title="Edit Your Username"
        placeholder="Type here..."
        warningLevel={2}
        onClose={() => setShowUsernameModal(false)}
        action={handleNewUsername}
      />

      <div className="profile-header">
        <h1 className="profile-username" onClick={() => setShowUsernameModal(true)}>
          {currentUser.username}
        </h1>
        
        <div>
          <div className="profile-level-section">
            <span className="profile-level-label">
              Level {currentUser.level} {getPermissionString(currentUser.permLevel)}
            </span>
            <span className="profile-xp-label">
              {currentLevelXP}/{xpPerLevel} XP
            </span>
          </div>
          
          <div className="profile-progress-bar">
            <div 
              className="profile-progress-fill"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="profile-divider" />

      <h2 className="achievements-title">
        Achievements
      </h2>

      <div className="achievements-grid">
        {achievements.map((achievement, index) => (
          <Achievement
            key={index}
            image={achievement.image}
            title={achievement.title}
            description={achievement.description}
            current={achievement.current}
            target={achievement.target}
            difficulty={achievement.difficulty}
            completed={achievement.completed}
          />
        ))}
      </div>
    </div>
  );
}

export default ProfilePage;