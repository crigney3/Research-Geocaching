import { useContext } from 'react';
import './profile.css';
import ResearchContext from '../ResearchContext';
import Achievement from '../Subcomponents/Achievement';

import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import BookIcon from '@mui/icons-material/Book';
import StarRateIcon from '@mui/icons-material/StarRate';
import CreateIcon from '@mui/icons-material/Create';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';

const ProfilePage = ({

}) => {
  const testUser = useContext(ResearchContext).testUser;

  const getPermissionString = (permLevel) => {
    switch (permLevel) {
      case 0: return 'student';
      case 1: return 'professor';
      case 2: return 'administrator';
      default: return 'user';
    }
  };

  // Calculate level progress
  const xpPerLevel = 1000;
  const currentLevelXP = testUser.xp % xpPerLevel;
  const levelProgress = (currentLevelXP / xpPerLevel) * 100;

  // Test achievements data
  const achievements = [
    {
      title: "First Steps",
      description: "Complete your first login",
      current: testUser.logins,
      target: 1,
      difficulty: 1
    },
    {
      title: "Explorer",
      description: "View facts around you",
      current: testUser.factsViewed,
      target: 10,
      difficulty: 2
    },
    {
      title: "Contributor",
      description: "Place facts on the map",
      current: testUser.factsPlaced,
      target: 5,
      difficulty: 3
    },
    {
      title: "Regular User",
      description: "Log in multiple times",
      current: testUser.logins,
      target: 7,
      difficulty: 0
    },
    {
      title: "Knowledge Seeker",
      description: "Discover many facts",
      current: testUser.factsViewed,
      target: 50,
      difficulty: 0
    },
    {
      title: "Map Maker",
      description: "Add facts to help others",
      current: testUser.factsPlaced,
      target: 25,
      difficulty: 0
    },
    {
      title: "Veteran",
      description: "Reach level 5",
      current: testUser.level,
      target: 5,
      difficulty: 0,
      image: <CreateIcon/>
    },
    {
      title: "Expert",
      description: "Accumulate experience",
      current: testUser.xp,
      target: 5000,
      difficulty: 0,
      image: <DirectionsWalkIcon/>
    }
  ];

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1 className="profile-username">
          {testUser.username}
        </h1>
        
        <div>
          <div className="profile-level-section">
            <span className="profile-level-label">
              Level {testUser.level} {getPermissionString(testUser.permLevel)}
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
          />
        ))}
      </div>
    </div>
  );
}

export default ProfilePage;