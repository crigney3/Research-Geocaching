import { InfoWindow } from '@vis.gl/react-google-maps';
import './FactPopup.css';

const FactPopup = ({
    anchor,
    title,
    description,
    username
}) => {
    const isLongContent = description && description.length > 200;

    return (
        <InfoWindow anchor={anchor} className='FactPopup' shouldFocus={true} headerContent={<h2 className='Title'>{title}</h2>}>
            <p className='Author'>Submitted by {username}</p>
            <p className={`PopupDescription ${isLongContent ? 'long-content' : ''}`}>{description}</p>
        </InfoWindow>
    )
}

export default FactPopup;