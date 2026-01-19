import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import BookIcon from '@mui/icons-material/Book';
import StarRateIcon from '@mui/icons-material/StarRate';
import CreateIcon from '@mui/icons-material/Create';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import BoltIcon from '@mui/icons-material/Bolt';

const achievements = [
    {
title: "First Steps",
description: "Log in for the first time",
current: 0,
target: 1,
difficulty: 0,
completed: false,
statBase: "daysUsed",
image: <CalendarMonthIcon/>
    },
    {
title: "Hiker",
description: "View a fact in your range",
current: 0,
target: 1,
difficulty: 0,
completed: false,
statBase: "factsViewed",
image: <BookIcon/>
    },
    {
title: "Make Your Mark",
description: "Add your first fact",
current: 0,
target: 1,
difficulty: 0,
completed: false,
statBase: "factsPlaced",
image: <CreateIcon/>
    },
    {
title: "Studied",
description: "Reach level 5",
current: 0,
target: 5,
difficulty: 0,
completed: false,
statBase: "level",
image: <BoltIcon/>
    },
    {
title: "Hey, you came back!",
description: "A long weekend's worth of logins",
current: 0,
target: 3,
difficulty: 1,
completed: false,
statBase: "daysUsed",
image: <CalendarMonthIcon/>
    },
    {
title: "Experienced",
description: "Reach level 15",
current: 0,
target: 15,
difficulty: 1,
completed: false,
statBase: "level",
image: <BoltIcon/>
    },
    {
title: "Bushwhacker",
description: "View several facts",
current: 0,
target: 10,
difficulty: 1,
completed: false,
statBase: "factsViewed",
image: <BookIcon/>
    },
    {
title: "Contributor",
description: "Add a few more facts",
current: 0,
target: 10,
difficulty: 1,
completed: false,
statBase: "factsPlaced",
image: <CreateIcon/>
    },
    {
title: "Regular User",
description: "A week's worth of logins",
current: 0,
target: 7,
difficulty: 2,
completed: false,
statBase: "daysUsed",
image: <CalendarMonthIcon/>
    },
    {
title: "Expert",
description: "Reach level 30",
current: 0,
target: 30,
difficulty: 2,
completed: false,
statBase: "level",
image: <BoltIcon/>
    },
    {
title: "World Traveller",
description: "View lots of facts",
current: 0,
target: 50,
difficulty: 2,
completed: false,
statBase: "factsViewed",
image: <BookIcon/>
    },
    {
title: "Cartographacter",
description: "Add a couple dozen facts. And then one more",
current: 0,
target: 25,
difficulty: 2,
completed: false,
statBase: "factsPlaced",
image: <CreateIcon/>
    },
    {
title: "Power User",
description: "A whole month's worth of logins",
current: 0,
target: 30,
difficulty: 3,
completed: false,
statBase: "daysUsed",
image: <CalendarMonthIcon/>
    },
    {
title: "Rick Steves",
description: "View way too many facts",
current: 0,
target: 300,
difficulty: 3,
completed: false,
statBase: "factsViewed",
image: <BookIcon/>
    },
    {
title: "Staple of the Community",
description: "Sprinkle four dozen facts around. And then a couple more",
current: 0,
target: 50,
difficulty: 3,
completed: false,
statBase: "factsPlaced",
image: <CreateIcon/>
    },
    {
title: "No More Impostor Syndrome",
description: "Reach level 50",
current: 0,
target: 50,
difficulty: 3,
completed: false,
statBase: "level",
image: <BoltIcon/>
    },
];

export default achievements;