import { useContext, useEffect, useState } from 'react';
import { ResearchContext } from '../ResearchContext';
import Select from 'react-select';
import { BACKEND_URL, CLIENT_AUTH_SECRET } from '../../secrets';
import './input.css';
import { Modal } from '../Subcomponents/Modal';

const InputPage = ({
    inLat,
    inLng
}) => {
    const [titleValue, setTitleValue] = useState("");
    const [descValue, setDescValue] = useState("");
    const [catValue, setCatValue] = useState(0);
    const [testChecked, setTestChecked] = useState(true);
    const [categoryOptions, setCategoryOptions] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalConfig, setModalConfig] = useState({ title: '', message: '', warningLevel: 0 });

    const allCategories = useContext(ResearchContext).allCategories;
    const currentUser = useContext(ResearchContext).currentUser;
    const reloadFacts = useContext(ResearchContext).getAllFacts;
    const userLevelUp = useContext(ResearchContext).checkForUserLevelup;
    const setCookie = useContext(ResearchContext).setWithExpiry;
    const getCookie = useContext(ResearchContext).getWithExpiry;
    const removeCookie = useContext(ResearchContext).removeWithExpiry;

    useEffect(() => {
        categoriesToOptions();
    }, [allCategories]);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (titleValue === "") {
            setModalConfig({
                title: 'Title Required',
                message: 'Please enter a title for your fact before submitting.',
                warningLevel: 1
            });
            setShowModal(true);
            return;
        } else if (descValue === "") {
            setModalConfig({
                title: 'Description Required',
                message: 'Please enter a description for your fact before submitting.',
                warningLevel: 1
            });
            setShowModal(true);
            return;
        } else if (!catValue) {
            setModalConfig({
                title: 'Category Required',
                message: 'Please select a category for your fact before submitting.',
                warningLevel: 1
            });
            setShowModal(true);
            return;
        }

        if (getFactLimiterArrayLength() > 3) {
            setModalConfig({
                title: 'Too Many Fact Submissions!',
                message: "You've submitted a lot of facts in the last 30 minutes. Try again later!",
                warningLevel: 1
            });
            setShowModal(true);
            return;
        }

        try {
            let JSONString = JSON.stringify({title: titleValue, description: descValue, lat: inLat, lng: inLng, category: catValue.value, userID: currentUser.id, username: currentUser.username});

            fetch(BACKEND_URL + "/add_fact", {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer: ${CLIENT_AUTH_SECRET}`,
                  'Content-Type': 'application/json;charset=utf-8'
                },
                mode: 'cors',
                body: JSONString
            }).then(response => {
                if (response.ok) {
                    setModalConfig({
                        title: 'Success!',
                        message: 'Your fact has been successfully submitted and saved.',
                        warningLevel: 2
                    });
                    setShowModal(true);
                    // Clear form on success
                    setTitleValue('');
                    setDescValue('');
                    setCatValue(null);

                    // Also reload facts
                    reloadFacts();
                    updatePlacedAchievement();

                    // And update the overload list
                    addToFactLimiterArray('fact');
                } else {
                    setModalConfig({
                        title: 'Submission Failed',
                        message: 'There was an error submitting your fact. Please try again. Response code: ' + response.status,
                        warningLevel: 0
                    });
                    setShowModal(true);
                }
            });
        } catch(err) {
            setModalConfig({
                title: 'Unexpected error!',
                message: err,
                warningLevel: 0
            });
            setShowModal(true);
        }
    }

    const updatePlacedAchievement = () => {
        userLevelUp('factsPlaced', 1);
    }

    const handleCatChange = (option) => {
        setCatValue(option);
    }

    const handleTitleChange = (event) => {
        setTitleValue(event.target.value);
    }

    const handleDescChange = (event) => {
        setDescValue(event.target.value);
    }

    const handleCheckedChange = (event) => {
        setTestChecked(!testChecked);
    }

    const removeExpiredAdditions = (items) => {
        if (!items || !Array.isArray(items)) {
            return [];
        }

        const now = Date.now();
        return items.filter(item => {
            const expiryTime = item.timestamp + (30 * 60 * 1000);
            return now < expiryTime;
        });
    };

    const addToFactLimiterArray = (element) => {
        // Get existing array or initialize empty array
        let cookieArray = getCookie('adds') || [];
        
        // Remove expired items before adding new one
        cookieArray = removeExpiredAdditions(cookieArray);
        
        // Add new item with timestamp
        const newItem = {
            data: element,
            timestamp: Date.now()
        };
        
        cookieArray.push(newItem);
        
        // Set cookie with expiration (set to expire after 30 minutes from now)
        // This is a safety measure, but individual items have their own expiry logic
        const cookieExpiry = new Date();
        cookieExpiry.setMinutes(cookieExpiry.getMinutes() + 30);
        
        setCookie('adds', cookieArray, 30, 1000 * 60);
    };

    const getFactLimiterArrayLength = () => {
        // Get existing array or initialize empty array
        let cookieArray = getCookie('adds') || [];
        
        // Remove expired items
        cookieArray = removeExpiredAdditions(cookieArray);
        
        // Update the cookie with cleaned array if items were removed
        if (cookieArray.length > 0) {
            const cookieExpiry = new Date();
            cookieExpiry.setMinutes(cookieExpiry.getMinutes() + 30);
            
            setCookie('adds', cookieArray, 30, 1000 * 60);
        } else {
            // Remove cookie if array is empty
            removeCookie('adds');
        }
        
        return cookieArray.length;
    };

    const categoriesToOptions = () => {
        let tempCat = [];

        allCategories.forEach((cat) => {
            tempCat.push({value: cat.id, label:cat.title});
        });

        setCategoryOptions(tempCat);
    }

    const handleModalClose = () => {
        setShowModal(false);
    };

    const customSelectStyles = {
        control: (provided, state) => ({
            ...provided,
            border: '2px solid var(--purple-main)',
            borderRadius: '15px',
            padding: '8px',
            fontSize: '1rem',
            boxShadow: state.isFocused ? '0 0 0 3px rgba(246, 139, 31, 0.2)' : 'none',
            borderColor: state.isFocused ? 'var(--orange-main)' : 'var(--purple-main)',
            background: 'var(--white)',
            minHeight: '50px',
            '&:hover': {
                borderColor: 'var(--purple-main)'
            }
        }),
        valueContainer: (provided) => ({
            ...provided,
            padding: '0 12px'
        }),
        singleValue: (provided) => ({
            ...provided,
            color: 'var(--purple-main)',
            fontWeight: '500'
        }),
        placeholder: (provided) => ({
            ...provided,
            color: 'var(--slate-accent)'
        }),
        indicatorSeparator: (provided) => ({
            ...provided,
            backgroundColor: 'var(--purple-main)'
        }),
        dropdownIndicator: (provided) => ({
            ...provided,
            color: 'var(--purple-main)'
        }),
        menu: (provided) => ({
            ...provided,
            borderRadius: '15px',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
            border: '1px solid rgba(76, 38, 131, 0.2)',
            zIndex: 9999
        }),
        option: (provided, state) => ({
            ...provided,
            color: 'var(--purple-main)',
            backgroundColor: state.isSelected ? 'var(--orange-main)' : 
                           state.isFocused ? 'rgba(76, 38, 131, 0.1)' : 'var(--white)',
            padding: '12px 16px',
            cursor: 'pointer',
            '&:hover': {
                backgroundColor: 'rgba(246, 139, 31, 0.1)',
                color: 'var(--purple-main)'
            }
        })
    };

    const handleInputFocus = (e) => {
        setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
    };

    return (
        <div className='InputPage'>
            <div className="full-form-wrapper" onSubmit={handleSubmit}>
                <div className="full-form">
                    <div className="top-row">
                        <div className="title-container">
                            <div className="form-group">
                                <label className="section-title">
                                    Title
                                </label>
                                <input 
                                    id="title" 
                                    type="text" 
                                    className="form-input title-input"
                                    placeholder="Enter title..."
                                    value={titleValue} 
                                    onChange={handleTitleChange}
                                    onFocus={handleInputFocus}
                                />
                            </div>
                        </div>

                        <div className="select-container">
                            <div className="form-group">
                                <label className="section-title">
                                    Category
                                </label>
                                <Select
                                    name="catSelector"
                                    options={categoryOptions}
                                    onChange={handleCatChange}
                                    styles={customSelectStyles}
                                    placeholder="Select category..."
                                    value={catValue}
                                    maxMenuHeight={250}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="description-container">
                        <h2 className="section-title">Description</h2>
                        <div className="form-group">
                            <textarea
                                id="desc"
                                className="form-input description-input"
                                placeholder="Enter a detailed description..."
                                value={descValue}
                                onChange={handleDescChange}
                                onFocus={handleInputFocus}
                            />
                        </div>
                    </div>
                </div>

                <button 
                    className="floating-submit"
                    onClick={handleSubmit}
                    type="button"
                    title="Submit"
                >
                    ✓
                </button>
            </div>

            <Modal show={showModal} onClose={handleModalClose} title={modalConfig.title} message={modalConfig.message} warningLevel={modalConfig.warningLevel} />
        </div>
    )
}

export default InputPage;