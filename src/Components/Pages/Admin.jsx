import { useState, useEffect, useContext } from "react";
import Select from "react-select";
import { ResearchContext } from "../ResearchContext";
import { BACKEND_URL } from "../../secrets";
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import { Modal, InputModal } from "../Subcomponents/Modal";
import './Admin.css';

const AdminPage = ({

}) => {

    const [catValue, setCatValue] = useState(0);
    const [categoryOptions, setCategoryOptions] = useState([]);
    const [newCatName, setNewCatName] = useState("");
    const [showUsernameModal, setShowUsernameModal] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalConfig, setModalConfig] = useState({ title: '', message: '', action: null });
    const [selectedUser, setSelectedUser] = useState(null);

    const allCategories = useContext(ResearchContext).allCategories;
    const allFacts = useContext(ResearchContext).allFacts;
    const allUsers = useContext(ResearchContext).allUsers;
    const getCatTitle = useContext(ResearchContext).getCategoryTitleFromID;
    const reloadFacts = useContext(ResearchContext).getAllFacts;
    const reloadCategories = useContext(ResearchContext).getAllCategories;
    const reloadUsers = useContext(ResearchContext).getAllUsers;
    const currentUser = useContext(ResearchContext).currentUser;

    const customSelectStyles = {
        control: (provided, state) => ({
            ...provided,
            border: '2px solid #4C2683',
            borderRadius: '15px',
            padding: '8px',
            fontSize: '1rem',
            boxShadow: state.isFocused ? '0 0 0 3px rgba(246, 139, 31, 0.2)' : 'none',
            borderColor: state.isFocused ? '#F68B1F' : '#4C2683',
            background: 'white',
            '&:hover': {
                borderColor: '#4C2683'
            }
        }),
        valueContainer: (provided) => ({
            ...provided,
            padding: '0 8px'
        }),
        singleValue: (provided) => ({
            ...provided,
            color: '#4C2683',
            fontWeight: '500'
        }),
        placeholder: (provided) => ({
            ...provided,
            color: '#7A99AC'
        }),
        indicatorSeparator: (provided) => ({
            ...provided,
            backgroundColor: '#4C2683'
        }),
        dropdownIndicator: (provided) => ({
            ...provided,
            color: '#4C2683'
        }),
        menu: (provided) => ({
            ...provided,
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
            border: '1px solid rgba(76, 38, 131, 0.2)',
            zIndex: 9999
        }),
        option: (provided, state) => ({
            ...provided,
            color: '#4C2683',
            backgroundColor: state.isSelected ? '#F68B1F' : 
                           state.isFocused ? 'rgba(76, 38, 131, 0.1)' : 'white',
            padding: '12px 16px',
            cursor: 'pointer',
            '&:hover': {
                backgroundColor: 'rgba(246, 139, 31, 0.1)',
                color: '#4C2683'
            }
        })
    };

    useEffect(() => {
        categoriesToOptions();
    }, [allCategories]);

    const categoriesToOptions = () => {
        let tempCat = [];

        allCategories.forEach((cat) => {
            tempCat.push({value: cat.id, label:cat.title});
        });

        setCategoryOptions(tempCat);
    }

    const removeAllFacts = async () => {
        try {
            await fetch(BACKEND_URL + "/remove_all_facts", {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json;charset=utf-8'
                },
                mode: 'cors'
            }).then(response => {
                if (response.ok) {
                    reloadFacts();
                }
            });
        } catch (err) {
            console.log(err);
        }
    }

    const handleAllFactRemoval = async (event) => {
        setModalConfig({
            title: 'Remove All Facts',
            message: 'Are you sure you want to remove all facts? This action cannot be undone.',
            warningLevel: 1,
            action: () => {
                removeAllFacts();
                setShowModal(false);
            }
        });
        setShowModal(true);
    }

    const removeFact = async (fact) => {
        try {
            await fetch(BACKEND_URL + "/remove_fact_by_id", {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json;charset=utf-8'
                },
                mode: 'cors',
                body: JSON.stringify({id: fact.id})
            }).then(response => {
                if (response.ok) {
                    reloadFacts();
                } else {
                    console.log(response);
                }
            });
        } catch (err) {
            console.log(err);
        }
    }

    const handleDeleteFact = (fact) => {
        setModalConfig({
            title: 'Delete Fact',
            message: `Are you sure you want to delete "${fact.title}"? This action cannot be undone.`,
            warningLevel: 1,
            action: () => {
                removeFact(fact);
                setShowModal(false);
            }
        });
        setShowModal(true);
    };

    const removeAllCategories = async () => {
        try {
            await fetch(BACKEND_URL + "/remove_all_categories", {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json;charset=utf-8'
                },
                mode: 'cors'
            }).then(response => {
                if (response.ok) {
                    reloadCategories();
                    reloadFacts();
                }
            });
        } catch (err) {
            console.log(err);
        }
    }

    const handleAllCatRemoval = async (event) => {
        setModalConfig({
            title: 'Remove All Categories',
            message: 'Are you sure you want to remove all categories? This will also remove all associated facts and cannot be undone.',
            warningLevel: 1,
            action: () => {
                removeAllCategories();
                setShowModal(false);
            }
        });
        setShowModal(true);
    }

    const handleCatChange = (option) => {
        setCatValue(option);
    }

    const handleNewCatNameChange = (event) => {
        setNewCatName(event.target.value);
    }

    const handleRemoveCat = async (event) => {
        let localCat = catValue;
        console.log(localCat);

        try {
            await fetch(BACKEND_URL + "/remove_category_by_id", {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json;charset=utf-8'
                },
                mode: 'cors',
                body: JSON.stringify({id: localCat.value})
            }).then(response => {
                
            });

            await fetch(BACKEND_URL + "/remove_all_facts_in_category", {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json;charset=utf-8'
                },
                mode: 'cors',
                body: JSON.stringify({id: localCat.value})
            }).then(response => {
                if (response.ok) {
                    reloadFacts();
                    reloadCategories();
                }
            });
        } catch (err) {
            console.log(err);
        }
    }

    const handleUsernameChange = async (newName) => {
        fetch(BACKEND_URL + "/change_username", {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json;charset=utf-8'
            },
            mode: 'cors',
            body: JSON.stringify({id: selectedUser.id, username: newName})
        }).then(response => {
            if (response.ok) {
                reloadUsers();
            } else {
                throw new Error("Request to change username failed!");
            }
        }).catch(error => {
            console.error('Error: ', error);
            return;
        } );   

        setShowUsernameModal(false);
    }

    const handleDeleteUser = (user) => {
        setModalConfig({
            title: 'Delete User',
            message: `Are you sure you want to delete "${user.username}"? This action cannot be undone.`,
            warningLevel: 1,
            action: () => {
                deleteUser(user);
                setShowModal(false);
            }
        });
        setShowModal(true);
    }

    const deleteUser =  async(user) => {
        try {
            await fetch(BACKEND_URL + "/remove_user_by_id", {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json;charset=utf-8'
                },
                mode: 'cors',
                body: JSON.stringify({id: user.id})
            }).then(response => {
                if (response.ok) {
                    reloadUsers();
                } else {
                    console.log(response);
                }
            });
        } catch (err) {
            console.log(err);
        }
    }

    const handleRemoveAllFactsOfCat = async (event) => {
        try {
            fetch(BACKEND_URL + "/remove_all_facts_in_category", {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json;charset=utf-8'
                },
                mode: 'cors',
                body: JSON.stringify({id: catValue.value})
            }).then(response => {
                if (response.ok) {
                    reloadFacts();
                    reloadCategories();
                }
            });
        } catch (err) {
            console.log(err);
        }
    }

    const handleNewCategoryAdd = async (event) => {
        if (newCatName === "") {
            // Title shouldn't be blank
            return;
        }

        try {
            await fetch(BACKEND_URL + "/add_category", {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json;charset=utf-8'
                },
                mode: 'cors',
                body: JSON.stringify({title: newCatName})
            }).then(response => {
                if (response.ok) {
                    reloadCategories();
                    setNewCatName("");
                }
            });
        } catch (err) {
            console.log(err);
        }
    }

    const handleModalCancel = () => {
        setShowModal(false);
    };

    const toggleShowUsernameModal = (user) => {
        setShowUsernameModal(!showUsernameModal);
        setSelectedUser(user);
    }

    const CustomSelect = ({ options, onChange }) => (
        <div className="react-select-container">
            <Select 
                options={categoryOptions}
                onChange={handleCatChange}
                styles={customSelectStyles}
                className="react-select-container"
                classNamePrefix="react-select"
                maxMenuHeight={250}
            />
        </div>
    );

    return (
        <div className='AdminPage'>
            <InputModal
                show={showUsernameModal}
                title="Force Edit this User's name"
                placeholder="Type here..."
                warningLevel={2}
                onClose={() => setShowUsernameModal(false)}
                action={handleUsernameChange}
            />

            <div className="AdminContent">
                <div className="category-section">
                    <h2 className="section-title">Category Management</h2>
                    <CustomSelect options={categoryOptions} onChange={handleCatChange}/>
                    <div className="category-buttons">
                        <button 
                            className="category-btn remove-cat-btn" 
                            onClick={handleRemoveCat}
                        >
                            Remove Selected Category
                        </button>
                        <button 
                            className="category-btn remove-facts-cat-btn" 
                            onClick={handleRemoveAllFactsOfCat}
                        >
                            Remove All Facts In Selected Category
                        </button>
                    </div>
                </div>

                <div className="input-section">
                    <h2 className="section-title">Add New Category</h2>
                    <input 
                        type="text" 
                        className="category-input"
                        placeholder="Enter category name..."
                        value={newCatName}
                        onChange={handleNewCatNameChange}
                    />
                    <button 
                        className="add-btn" 
                        onClick={handleNewCategoryAdd}
                    >
                        Add New Category
                    </button>
                </div>

                <div className="all-facts">
                    <h2 className="section-title">All Facts</h2>
                    {allFacts.map((fact) => (
                        <div className="fact-card" key={fact.id}>
                            <button 
                                className="fact-delete-btn"
                                onClick={() => handleDeleteFact(fact)}
                                title="Delete fact"
                            >
                                <CloseIcon size={16} />
                            </button>
                            <h3 className="fact-title">{fact.title}</h3>
                            <p className="fact-description">{fact.description}</p>
                            <div className="fact-details">
                                <span className="fact-detail">Lat: {fact.lat}, Lng: {fact.lng}</span>
                                <span className="fact-detail">User: {fact.user}</span>
                                <span className="fact-detail">Category: {getCatTitle(fact.category, allCategories)}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {(currentUser != null) && (currentUser.permLevel >= 2) &&
                <div className="user-section">
                    <h2 className="section-title">User Management</h2>
                    {allUsers.map((user) => (
                        <div className="fact-card" key={user.id}>
                            {((currentUser.permissions >= user.permissions) || (currentUser.id === user.id)) && <button 
                                className="fact-delete-btn"
                                onClick={() => handleDeleteUser(user)}
                                title="Delete User"
                            >
                                <CloseIcon size={16} />
                            </button>}
                            <h3 className="user-title">{user.username}</h3>
                            <button
                                className="user-namechange-btn"
                                onClick={() => toggleShowUsernameModal(user)}
                                title="Force change username"
                            >
                                <EditIcon size={16} />
                            </button>
                            <div className="user-details">
                                <span className="user-detail">Level: {user.level}</span>
                                <span className="user-detail">XP: {user.xp}</span>
                                <span className="user-detail">Permissions Level: {user.permissions}</span>
                            </div>
                        </div>
                    ))}
                </div>}

                <div className="floating-buttons">
                    <button 
                        className="floating-btn remove-all-facts" 
                        onClick={handleAllFactRemoval}
                    >
                        Remove All Facts
                    </button>
                    <button 
                        className="floating-btn remove-all-cats" 
                        onClick={handleAllCatRemoval}
                    >
                        Remove All Categories
                    </button>
                </div>
            </div>

            <Modal show={showModal} onClose={handleModalCancel} title={modalConfig.title} message={modalConfig.message} warningLevel={modalConfig.warningLevel} action={modalConfig.action}/>
        </div>
    )
}

export default AdminPage;