import { useState, useEffect, useContext } from "react";
import Select from "react-select";
import { ResearchContext } from "../ResearchContext";
import { BACKEND_URL, CLIENT_AUTH_SECRET } from "../../secrets";
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { Modal, InputModal, FactModal } from "../Subcomponents/Modal";
import './Admin.css';

const AdminPage = () => {
 
    const [catValue, setCatValue] = useState(0);
    const [categoryOptions, setCategoryOptions] = useState([]);
    const [newCatName, setNewCatName] = useState("");
    const [newUserEmail, setNewUserEmail] = useState("");
    const [showUsernameModal, setShowUsernameModal] = useState(false);
    const [showFactModal, setShowFactModal] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalConfig, setModalConfig] = useState({ title: '', message: '', action: null });
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedFact, setSelectedFact] = useState(null);
 
    const context = useContext(ResearchContext);
    const currentUser = context.currentUser;
    const allCategories = context.allCategories;
    const allFacts = context.allFacts;
    const allUsers = context.allUsers;
    const reloadFacts = context.getAllFacts;
    const reloadCategories = context.getAllCategories;
    const reloadUsers = context.getAllUsers;
    const getCatTitle = context.getCategoryTitleFromID;
 
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
 
    const getFlagBackground = (flags) => {
        if (!flags || flags === 0) return 'rgba(76, 38, 131, 0.05)';
        const intensity = Math.min(flags / 8, 1);
        return `rgba(224, 78, 57, ${intensity * 0.55})`;
    };
 
    useEffect(() => {
        if (currentUser == null) return;
    }, [currentUser]);
 
    useEffect(() => {
        categoriesToOptions();
    }, [allCategories]);
 
    const categoriesToOptions = () => {
        let tempCat = [];
        allCategories.forEach((cat) => {
            tempCat.push({ value: cat.id, label: cat.title });
        });
        setCategoryOptions(tempCat);
    };
 
    const handleCatChange = (option) => {
        setCatValue(option);
    };
 
    const handleNewCatNameChange = (event) => {
        setNewCatName(event.target.value);
    };
 
    const handleUserInputChange = (event) => {
        setNewUserEmail(event.target.value);
    };
 
    const handleModalCancel = () => {
        setShowModal(false);
    };
 
    // Always creates a public category (privacy: false)
    const handleNewCategoryAdd = async () => {
        if (newCatName === "") return;
 
        const jsonString = JSON.stringify({
            title: newCatName,
            ownerID: currentUser.id,
            privacy: false
        });
 
        try {
            await fetch(BACKEND_URL + "/add_category", {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer: ${CLIENT_AUTH_SECRET}`,
                    'Content-Type': 'application/json;charset=utf-8'
                },
                mode: 'cors',
                body: jsonString
            }).then(response => {
                if (response.ok) {
                    reloadCategories();
                    setNewCatName("");
                }
            });
        } catch (err) {
            console.log(err);
        }
    };
 
    const handleRemoveCat = async () => {
        const localCat = catValue;
 
        try {
            await fetch(BACKEND_URL + "/remove_category_by_id", {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer: ${CLIENT_AUTH_SECRET}`,
                    'Content-Type': 'application/json;charset=utf-8'
                },
                mode: 'cors',
                body: JSON.stringify({ id: localCat.value })
            });
 
            await fetch(BACKEND_URL + "/remove_all_facts_in_category", {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer: ${CLIENT_AUTH_SECRET}`,
                    'Content-Type': 'application/json;charset=utf-8'
                },
                mode: 'cors',
                body: JSON.stringify({ id: localCat.value })
            }).then(response => {
                if (response.ok) {
                    reloadFacts();
                    reloadCategories();
                }
            });
        } catch (err) {
            console.log(err);
        }
    };
 
    const handleRemoveAllFactsOfCat = async () => {
        try {
            await fetch(BACKEND_URL + "/remove_all_facts_in_category", {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer: ${CLIENT_AUTH_SECRET}`,
                    'Content-Type': 'application/json;charset=utf-8'
                },
                mode: 'cors',
                body: JSON.stringify({ id: catValue.value })
            }).then(response => {
                if (response.ok) {
                    reloadFacts();
                    reloadCategories();
                }
            });
        } catch (err) {
            console.log(err);
        }
    };
 
    const removeAllFacts = async () => {
        try {
            await fetch(BACKEND_URL + "/remove_all_facts", {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer: ${CLIENT_AUTH_SECRET}`,
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
    };
 
    const handleAllFactRemoval = () => {
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
    };
 
    const removeAllCategories = async () => {
        try {
            await fetch(BACKEND_URL + "/remove_all_categories", {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer: ${CLIENT_AUTH_SECRET}`,
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
    };
 
    const handleAllCatRemoval = () => {
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
    };
 
    const removeFact = async (fact) => {
        try {
            await fetch(BACKEND_URL + "/remove_fact_by_id", {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer: ${CLIENT_AUTH_SECRET}`,
                    'Content-Type': 'application/json;charset=utf-8'
                },
                mode: 'cors',
                body: JSON.stringify({ id: fact.id })
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
    };
 
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
 
    const handleReadMoreFact = (fact) => {
        setSelectedFact(fact);
        setShowFactModal(true);
    };
 
    const handleUsernameChange = async (newName) => {
        fetch(BACKEND_URL + "/change_username", {
            method: 'POST',
            headers: {
                'Authorization': `Bearer: ${CLIENT_AUTH_SECRET}`,
                'Content-Type': 'application/json;charset=utf-8'
            },
            mode: 'cors',
            body: JSON.stringify({ id: selectedUser.id, username: newName })
        }).then(response => {
            if (response.ok) {
                reloadUsers();
            } else {
                throw new Error("Request to change username failed!");
            }
        }).catch(error => {
            console.error('Error: ', error);
        });
 
        setShowUsernameModal(false);
    };
 
    const handleDeleteUser = (user) => {
        setModalConfig({
            title: 'Delete User',
            message: user.id === currentUser.id
                ? 'Are you sure you want to delete your account? This action cannot be undone.'
                : `Are you sure you want to delete "${user.username}"? This action cannot be undone.`,
            warningLevel: 1,
            action: () => {
                deleteUser(user);
                setShowModal(false);
            }
        });
        setShowModal(true);
    };
 
    const deleteUser = async (user) => {
        try {
            await fetch(BACKEND_URL + "/remove_user_by_id", {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer: ${CLIENT_AUTH_SECRET}`,
                    'Content-Type': 'application/json;charset=utf-8'
                },
                mode: 'cors',
                body: JSON.stringify({ id: user.id })
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
    };
 
    const toggleShowUsernameModal = (user) => {
        setShowUsernameModal(!showUsernameModal);
        setSelectedUser(user);
    };
 
    const CustomSelect = () => (
        <div className="react-select-container">
            <Select
                options={categoryOptions}
                onChange={handleCatChange}
                styles={customSelectStyles}
                value={catValue}
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
 
            {(selectedFact != null) && (
                <FactModal
                    show={showFactModal}
                    title={selectedFact.title}
                    description={selectedFact.description}
                    user={selectedFact.username}
                    onClose={() => setShowFactModal(false)}
                    userId={selectedFact.user}
                    factId={selectedFact.id}
                />
            )}
 
            <div className="AdminContent">
 
                {/* Global category management */}
                <div className="category-section">
                    <h2 className="section-title">Category Management</h2>
                    <CustomSelect />
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
 
                {/* Add a new public category */}
                <div className="input-section">
                    <h2 className="section-title">Add New Public Category</h2>
                    <div className="category-input-container">
                        <input
                            type="text"
                            className="category-input"
                            placeholder="Enter category name..."
                            value={newCatName}
                            onChange={handleNewCatNameChange}
                        />
                    </div>
                    <button className="add-btn" onClick={handleNewCategoryAdd}>
                        Add New Category
                    </button>
                </div>
 
                {/* All facts */}
                <div className="all-facts">
                    <h2 className="section-title">All Facts</h2>
                    {allFacts.map((fact) => (
                        <div
                            className="fact-card"
                            key={fact.id}
                            style={{ background: getFlagBackground(fact.flags) }}
                        >
                            <button
                                className="fact-delete-btn"
                                onClick={() => handleDeleteFact(fact)}
                                title="Delete fact"
                            >
                                <CloseIcon size={16} />
                            </button>
                            <button
                                className="fact-read-more-btn"
                                onClick={() => handleReadMoreFact(fact)}
                                title="Read more"
                            >
                                Read More
                            </button>
                            <h3 className="fact-title">{fact.title}</h3>
                            <p className="fact-description">{fact.description}</p>
                            <div className="fact-details">
                                <span className="fact-detail">Lat: {fact.lat}, Lng: {fact.lng}</span>
                                <span className="fact-detail">User: {fact.username}</span>
                                <span className="fact-detail">Category: {getCatTitle(fact.category, allCategories)}</span>
                                <span className="fact-detail">Active Flags: {fact.flags ?? 0}</span>
                                <span className="fact-detail">Total Flags: {fact.totalFlags ?? 0}</span>
                            </div>
                        </div>
                    ))}
                </div>
 
                {/* All users */}
                <div className="user-section">
                    <h2 className="section-title">User Management</h2>
                    {allUsers.map((user) => (
                        <div className="fact-card" key={user.id}>
                            {((currentUser.permLevel > user.permLevel) || (currentUser.id === user.id)) && (
                                <button
                                    className="fact-delete-btn"
                                    onClick={() => handleDeleteUser(user)}
                                    title="Delete User"
                                >
                                    <CloseIcon size={16} />
                                </button>
                            )}
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
                                <span className="user-detail">Permissions Level: {user.permLevel}</span>
                                <span className="user-detail">Date Joined: {user.dateJoined}</span>
                                <span className="user-detail">Last Login Date: {user.lastLogin}</span>
                                <span className="user-detail">Facts Placed: {user.factsPlaced}</span>
                            </div>
                        </div>
                    ))}
                </div>
 
                {/* Floating danger buttons */}
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
 
            <Modal
                show={showModal}
                onClose={handleModalCancel}
                title={modalConfig.title}
                message={modalConfig.message}
                warningLevel={modalConfig.warningLevel}
                action={modalConfig.action}
            />
        </div>
    );
};

const PrivateCategoriesPage = () => {
 
    const [catValue, setCatValue] = useState(0);
    const [categoryOptions, setCategoryOptions] = useState([]);
    const [newCatName, setNewCatName] = useState("");
    const [newUserEmail, setNewUserEmail] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [modalConfig, setModalConfig] = useState({ title: '', message: '', action: null });
    const [showFactModal, setShowFactModal] = useState(false);
    const [selectedFact, setSelectedFact] = useState(null);
 
    const context = useContext(ResearchContext);
    const currentUser = context.currentUser;
    const allCategories = context.allOwnedCategories;
    const allFacts = context.allFactsOfOwnedCategories;
    const allUsersOfOwnedCategories = context.allUsersOfOwnedCategories;
    const reloadFacts = context.getAllFactsOfOwnedCategories;
    const reloadCategories = context.getAllOwnedCategories;
    const reloadUsers = context.getAllUsersOfOwnedCategories;
    const getCatTitle = context.getCategoryTitleFromID;
    const reloadCurrentUser = context.checkForExistingUser;
    const allAccessibleCategories = context.allAccessibleCategories;
 
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
 
    const getFlagBackground = (flags) => {
        if (!flags || flags === 0) return 'rgba(76, 38, 131, 0.05)';
        const intensity = Math.min(flags / 8, 1);
        return `rgba(224, 78, 57, ${intensity * 0.55})`;
    };
 
    useEffect(() => {
        categoriesToOptions();
    }, [allCategories]);
 
    const categoriesToOptions = () => {
        let tempCat = [];
        if (!allCategories) return;
        allCategories.forEach((cat) => {
            tempCat.push({ value: cat.id, label: cat.title });
        });
        setCategoryOptions(tempCat);
    };
 
    const handleCatChange = (option) => {
        setCatValue(option);
    };
 
    const handleNewCatNameChange = (event) => {
        setNewCatName(event.target.value);
    };
 
    const handleUserInputChange = (event) => {
        setNewUserEmail(event.target.value);
    };
 
    const handleModalCancel = () => {
        setShowModal(false);
    };
 
    // Always creates a private category (privacy: true)
    const handleNewCategoryAdd = async () => {
        if (newCatName === "") return;
 
        const jsonString = JSON.stringify({
            title: newCatName,
            ownerID: currentUser.id,
            privacy: true
        });
 
        try {
            await fetch(BACKEND_URL + "/add_category", {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer: ${CLIENT_AUTH_SECRET}`,
                    'Content-Type': 'application/json;charset=utf-8'
                },
                mode: 'cors',
                body: jsonString
            }).then(response => {
                if (response.ok) {
                    reloadCategories();
                    setNewCatName("");
                }
            });
        } catch (err) {
            console.log(err);
        }
    };
 
    const handleRemoveCat = async () => {
        const localCat = catValue;
 
        try {
            await fetch(BACKEND_URL + "/remove_category_by_id", {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer: ${CLIENT_AUTH_SECRET}`,
                    'Content-Type': 'application/json;charset=utf-8'
                },
                mode: 'cors',
                body: JSON.stringify({ id: localCat.value })
            });
 
            await fetch(BACKEND_URL + "/remove_all_facts_in_category", {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer: ${CLIENT_AUTH_SECRET}`,
                    'Content-Type': 'application/json;charset=utf-8'
                },
                mode: 'cors',
                body: JSON.stringify({ id: localCat.value })
            }).then(response => {
                if (response.ok) {
                    reloadFacts();
                    reloadCategories();
                }
            });
        } catch (err) {
            console.log(err);
        }
    };
 
    const handleRemoveAllFactsOfCat = async () => {
        try {
            await fetch(BACKEND_URL + "/remove_all_facts_in_category", {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer: ${CLIENT_AUTH_SECRET}`,
                    'Content-Type': 'application/json;charset=utf-8'
                },
                mode: 'cors',
                body: JSON.stringify({ id: catValue.value })
            }).then(response => {
                if (response.ok) {
                    reloadFacts();
                    reloadCategories();
                }
            });
        } catch (err) {
            console.log(err);
        }
    };
 
    const handleRemoveUserFromCategory = async () => {
        if (!currentUser || catValue === 0 || newUserEmail === "") return;
 
        const jsonString = JSON.stringify({ catID: catValue.value, email: newUserEmail });
 
        try {
            await fetch(BACKEND_URL + "/remove_user_from_private_category", {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer: ${CLIENT_AUTH_SECRET}`,
                    'Content-Type': 'application/json;charset=utf-8'
                },
                mode: 'cors',
                body: jsonString
            }).then(response => {
                if (response.ok) {
                    reloadUsers();
                }
            });
        } catch (err) {
            console.log(err);
        }
    };
 
    const handleAddUserToCategory = async () => {
        if (!currentUser || catValue === 0 || newUserEmail === "") return;
 
        const jsonString = JSON.stringify({ catID: catValue.value, email: newUserEmail });
 
        try {
            await fetch(BACKEND_URL + "/add_user_to_private_category", {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer: ${CLIENT_AUTH_SECRET}`,
                    'Content-Type': 'application/json;charset=utf-8'
                },
                mode: 'cors',
                body: jsonString
            }).then(response => {
                if (response.ok) {
                    reloadUsers();
                }
            });
        } catch (err) {
            console.log(err);
        }
    };
 
    const leaveCategory = (category) => {
        setModalConfig({
            title: 'Leaving category: ' + getCatTitle(category, allAccessibleCategories),
            message: 'Are you sure you want to leave this category? You would need to be re-invited to rejoin.',
            warningLevel: 1,
            action: () => {
                handleLeaveCategory(category);
                setShowModal(false);
            }
        });
        setShowModal(true);
    };
 
    const handleLeaveCategory = async (category) => {
        const jsonString = JSON.stringify({ catID: category, userID: currentUser.id });
 
        try {
            await fetch(BACKEND_URL + "/remove_user_from_private_category", {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer: ${CLIENT_AUTH_SECRET}`,
                    'Content-Type': 'application/json;charset=utf-8'
                },
                mode: 'cors',
                body: jsonString
            }).then(response => {
                if (response.ok) {
                    reloadCurrentUser();
                    reloadCategories();
                }
            });
        } catch (err) {
            console.log(err);
        }
    };
 
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
 
    const removeFact = async (fact) => {
        try {
            await fetch(BACKEND_URL + "/remove_fact_by_id", {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer: ${CLIENT_AUTH_SECRET}`,
                    'Content-Type': 'application/json;charset=utf-8'
                },
                mode: 'cors',
                body: JSON.stringify({ id: fact.id })
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
    };
 
    const handleReadMoreFact = (fact) => {
        setSelectedFact(fact);
        setShowFactModal(true);
    };
 
    const CustomSelect = () => (
        <div className="react-select-container">
            <Select
                options={categoryOptions}
                onChange={handleCatChange}
                styles={customSelectStyles}
                value={catValue}
                className="react-select-container"
                classNamePrefix="react-select"
                maxMenuHeight={250}
            />
        </div>
    );
 
    return (
        <div className='AdminPage'>
            {(selectedFact != null) && (
                <FactModal
                    show={showFactModal}
                    title={selectedFact.title}
                    description={selectedFact.description}
                    user={selectedFact.username}
                    onClose={() => setShowFactModal(false)}
                    userId={selectedFact.user}
                    factId={selectedFact.id}
                />
            )}
 
            <div className="AdminContent">
 
                {/* Categories the user has been invited to (not owned) */}
                {(currentUser != null) && (currentUser.privateCategoryAccess != null) && (
                    <div className="category-section">
                        <h2 className="section-title">Private Category Membership</h2>
                        {JSON.parse(currentUser.privateCategoryAccess).map((category) => (
                            <div className="fact-card" key={category}>
                                <button
                                    className="fact-delete-btn"
                                    onClick={() => leaveCategory(category)}
                                    title="Leave category"
                                >
                                    <ExitToAppIcon size={16} />
                                </button>
                                <h3 className="fact-title">{getCatTitle(category, allAccessibleCategories)}</h3>
                            </div>
                        ))}
                    </div>
                )}
 
                {/* Create a new private category */}
                <div className="input-section">
                    <h2 className="section-title">Add New Private Category</h2>
                    <div className="category-input-container">
                        <input
                            type="text"
                            className="category-input"
                            placeholder="Enter category name..."
                            value={newCatName}
                            onChange={handleNewCatNameChange}
                        />
                    </div>
                    <button className="add-btn" onClick={handleNewCategoryAdd}>
                        Add New Category
                    </button>
                </div>
 
                {/* Manage owned private categories */}
                {(currentUser != null) && (currentUser.ownedCategories != null) && (
                    <div className="category-section">
                        <h2 className="section-title">My Private Categories</h2>
                        <CustomSelect />
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
                        <div className="category-user-add">
                            <input
                                type="text"
                                className="category-input-email"
                                placeholder="Enter user's email..."
                                value={newUserEmail}
                                onChange={handleUserInputChange}
                            />
                            <div className="category-user-buttons">
                                <button
                                    className="category-user-btn remove-user-btn"
                                    onClick={handleRemoveUserFromCategory}
                                >
                                    Remove User
                                </button>
                                <button
                                    className="category-user-btn add-user-btn"
                                    onClick={handleAddUserToCategory}
                                >
                                    Add User
                                </button>
                            </div>
                        </div>
                    </div>
                )}
 
                {/* Facts within owned private categories */}
                {(currentUser != null) && (currentUser.ownedCategories != null) && (
                    <div className="all-facts">
                        <h2 className="section-title">My Private Categories — Facts</h2>
                        {allFacts && allFacts.map((fact) => (
                            <div
                                className="fact-card"
                                key={fact.id}
                                style={{ background: getFlagBackground(fact.flags) }}
                            >
                                <button
                                    className="fact-delete-btn"
                                    onClick={() => handleDeleteFact(fact)}
                                    title="Delete fact"
                                >
                                    <CloseIcon size={16} />
                                </button>
                                <button
                                    className="fact-read-more-btn"
                                    onClick={() => handleReadMoreFact(fact)}
                                    title="Read more"
                                >
                                    Read More
                                </button>
                                <h3 className="fact-title">{fact.title}</h3>
                                <p className="fact-description">{fact.description}</p>
                                <div className="fact-details">
                                    <span className="fact-detail">Lat: {fact.lat}, Lng: {fact.lng}</span>
                                    <span className="fact-detail">User: {fact.username}</span>
                                    <span className="fact-detail">Category: {getCatTitle(fact.category, allAccessibleCategories)}</span>
                                    <span className="fact-detail">Active Flags: {fact.flags ?? 0}</span>
                                    <span className="fact-detail">Total Flags: {fact.totalFlags ?? 0}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
 
                {/* Users in owned private categories */}
                {(currentUser != null) && (currentUser.ownedCategories != null) && (
                    <div className="user-section">
                        <h2 className="section-title">Members of My Categories</h2>
                        {allUsersOfOwnedCategories && allUsersOfOwnedCategories.map((user) => (
                            <div className="fact-card" key={user.id}>
                                <h3 className="user-title">{user.username}</h3>
                                <div className="user-details">
                                    <span className="user-detail">Level: {user.level}</span>
                                    <span className="user-detail">XP: {user.xp}</span>
                                    <span className="user-detail">Permissions Level: {user.permLevel}</span>
                                    <span className="user-detail">Date Joined: {user.dateJoined}</span>
                                    <span className="user-detail">Last Login Date: {user.lastLogin}</span>
                                    <span className="user-detail">Facts Placed: {user.factsPlaced}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
 
                {/* Delete own account */}
                <div className="floating-buttons">
                    <button
                        className="floating-btn remove-all-facts"
                        onClick={() => {
                            setModalConfig({
                                title: 'Delete User',
                                message: 'Are you sure you want to delete your account? This action cannot be undone.',
                                warningLevel: 1,
                                action: async () => {
                                    await fetch(BACKEND_URL + "/remove_user_by_id", {
                                        method: 'POST',
                                        headers: {
                                            'Authorization': `Bearer: ${CLIENT_AUTH_SECRET}`,
                                            'Content-Type': 'application/json;charset=utf-8'
                                        },
                                        mode: 'cors',
                                        body: JSON.stringify({ id: currentUser.id })
                                    });
                                    setShowModal(false);
                                }
                            });
                            setShowModal(true);
                        }}
                    >
                        Delete Your Account
                    </button>
                </div>
            </div>
 
            <Modal
                show={showModal}
                onClose={handleModalCancel}
                title={modalConfig.title}
                message={modalConfig.message}
                warningLevel={modalConfig.warningLevel}
                action={modalConfig.action}
            />
        </div>
    );
};

export {
    AdminPage,
    PrivateCategoriesPage
};