import { useContext, useEffect, useState } from 'react';
import ResearchContext from '../ResearchContext';
import Select from 'react-select';
import { BACKEND_URL } from '../../secrets';
import './input.css';

const UETestLoc = {
    lat: 37.97336898429983,
    lng: -87.53240843750176
}

const InputPage = ({
    
}) => {
    const [titleValue, setTitleValue] = useState("");
    const [descValue, setDescValue] = useState("");
    const [catValue, setCatValue] = useState(0);
    const [testChecked, setTestChecked] = useState(true);
    const [categoryOptions, setCategoryOptions] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalConfig, setModalConfig] = useState({ title: '', message: '', isSuccess: false });

    const allCategories = useContext(ResearchContext).allCategories;
    const userLoc = useContext(ResearchContext).currentLocation;
    const reloadFacts = useContext(ResearchContext).getAllFacts;

    useEffect(() => {
        categoriesToOptions();
    }, [allCategories]);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (titleValue === "") {
            setModalConfig({
                title: 'Title Required',
                message: 'Please enter a title for your fact before submitting.',
                isSuccess: false
            });
            setShowModal(true);
            return;
        } else if (descValue === "") {
            setModalConfig({
                title: 'Description Required',
                message: 'Please enter a description for your fact before submitting.',
                isSuccess: false
            });
            setShowModal(true);
            return;
        } else if (!catValue) {
            setModalConfig({
                title: 'Category Required',
                message: 'Please select a category for your fact before submitting.',
                isSuccess: false
            });
            setShowModal(true);
            return;
        }

        try {
            let JSONString = "";
            if (testChecked) {
                JSONString = JSON.stringify({title: titleValue, description: descValue, lat: userLoc?.coords.latitude, lng: userLoc?.coords.longitude, category: catValue.value});
            } else {
                JSONString = JSON.stringify({title: titleValue, description: descValue, lat: UETestLoc.lat, lng: UETestLoc.lng, category: catValue.value});
            }

            fetch(BACKEND_URL + "/add_fact", {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json;charset=utf-8'
                },
                mode: 'cors',
                body: JSONString
            }).then(response => {
                if (response.ok) {
                    setModalConfig({
                        title: 'Success!',
                        message: 'Your fact has been successfully submitted and saved.',
                        isSuccess: true
                    });
                    setShowModal(true);
                    // Clear form on success
                    setTitleValue('');
                    setDescValue('');
                    setCatValue(null);
                    // Also reload facts
                    reloadFacts();
                } else {
                    setModalConfig({
                        title: 'Submission Failed',
                        message: 'There was an error submitting your fact. Please try again. Response code: ' + response.json(),
                        isSuccess: false
                    });
                    setShowModal(true);
                }
            });
        } catch(err) {
            setModalConfig({
                title: 'Unexpected error!',
                message: err,
                isSuccess: false
            });
            setShowModal(true);
        }
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
        setTestChecked(event.target.value);
    }

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

    return (
        <div className='InputPage'>
            <form className="full-form" onSubmit={handleSubmit}>
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
                        />
                    </div>
                </div>

                <div className="test-checkbox">
                    <input 
                        type="checkbox" 
                        checked={testChecked} 
                        onChange={handleCheckedChange}
                    />
                    <label>Test checkbox (will be removed in production)</label>
                </div>

                <button 
                    className="floating-submit"
                    type="submit"
                    title="Submit"
                >
                    ✓
                </button>
            </form>

            <div className={`modal-overlay ${showModal ? 'show' : ''}`}>
                <div className="modal-container">
                    <div className={`modal-icon ${modalConfig.isSuccess ? 'success' : 'error'}`}>
                        {modalConfig.isSuccess ? '✓' : '⚠️'}
                    </div>
                    <h3 className="modal-title">{modalConfig.title}</h3>
                    <p className="modal-message">{modalConfig.message}</p>
                    <button 
                        className={`modal-button ${modalConfig.isSuccess ? 'success' : 'error'}`}
                        onClick={handleModalClose}
                    >
                        {modalConfig.isSuccess ? 'Great!' : 'Close'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default InputPage;