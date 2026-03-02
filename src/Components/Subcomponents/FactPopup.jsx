import { InfoWindow } from '@vis.gl/react-google-maps';
import './FactPopup.css';
import { useState, useContext } from 'react';
import { ResearchContext } from '../ResearchContext';
import FlagIcon from '@mui/icons-material/Flag';
import OutlinedFlagIcon from '@mui/icons-material/OutlinedFlag';
import BlockIcon from '@mui/icons-material/Block';

const FactPopup = ({
    anchor,
    title,
    description,
    username,
    userId,
    factId,
    closeFact,
    fullscreenFact
}) => {
    const isLongContent = description && description.length > 200;
    const { currentUser, blockUser, unblockUser, flagFact, unflagFact } = useContext(ResearchContext);

    const isBlocked = currentUser?.blocked?.includes(userId) ?? false;
    const isFlagged = currentUser?.flaggedFacts?.includes(factId) ?? false;

    const handleBlock = async () => {
        if (isBlocked) {
            await unblockUser(userId);
        } else {
            await blockUser(userId);
            closeFact();
        }
    };

    const handleFlag = async () => {
        if (isFlagged) {
            await unflagFact(factId);
        } else {
            await flagFact(factId);
        }
    };

    const showActions = currentUser && userId && userId !== currentUser.id;

    return (
        <InfoWindow
            anchor={anchor}
            className='FactPopup'
            shouldFocus={true}
            headerContent={<h2 className='Title'>{title}</h2>}
            onCloseClick={closeFact}
        >
            <p className='Author'>Submitted by {username}</p>
            <p className={`PopupDescription ${isLongContent ? 'long-content' : ''}`}>{description}</p>
            <div className='popup-footer'>
                <button className='ReadMore' onClick={fullscreenFact}>Read More</button>
                {showActions && (
                    <div className='popup-action-buttons'>
                        <button
                            className={`popup-action-btn ${isFlagged ? 'flagged' : ''}`}
                            onClick={handleFlag}
                            title={isFlagged ? 'Remove flag' : 'Flag content'}
                        >
                            {isFlagged
                                ? <FlagIcon fontSize="small" />
                                : <OutlinedFlagIcon fontSize="small" />}
                        </button>
                        <button
                            className={`popup-action-btn ${isBlocked ? 'blocked' : ''}`}
                            onClick={handleBlock}
                            title={isBlocked ? 'Unblock user' : 'Block user'}
                        >
                            <BlockIcon fontSize="small" />
                        </button>
                    </div>
                )}
            </div>
        </InfoWindow>
    );
};

export default FactPopup;