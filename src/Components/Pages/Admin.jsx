import { useState, useEffect, useContext } from "react";
import Select from "react-select";
import ResearchContext from "../ResearchContext";
import { BACKEND_URL } from "../../secrets";

const AdminPage = ({

}) => {

    const [catValue, setCatValue] = useState(0);
    const [categoryOptions, setCategoryOptions] = useState([]);
    const [newCatName, setNewCatName] = useState("");
    const [isLitterboxDirty, setIsLitterboxDirty] = useState(false);

    const allCategories = useContext(ResearchContext).allCategories;
    const allFacts = useContext(ResearchContext).allFacts;
    const getCatTitle = useContext(ResearchContext).getCategoryTitleFromID;

    useEffect(() => {
        categoriesToOptions();
        //console.log(allCategories);
    }, [allCategories]);

    useEffect(() => {
        console.log(allFacts);
    }, [allFacts]);

    const categoriesToOptions = () => {
        let tempCat = [];

        allCategories.forEach((cat) => {
            tempCat.push({value: cat.id, label:cat.title});
        });

        setCategoryOptions(tempCat);
    }

    const handleAllFactRemoval = async (event) => {
        try {
            await fetch(BACKEND_URL + "/remove_all_facts", {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json;charset=utf-8'
                },
                mode: 'cors'
            }).then(response => {

            });
        } catch (err) {
            console.log(err);
        }
    }

    const handleAllCatRemoval = async (event) => {
        try {
            await fetch(BACKEND_URL + "/remove_all_categories", {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json;charset=utf-8'
                },
                mode: 'cors'
            }).then(response => {

            });
        } catch (err) {
            console.log(err);
        }
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
            
        });
        } catch (err) {
            console.log(err);
        }
    }

    const handleRemoveAllFactsOfCat = async (event) => {
        try {

        } catch (err) {
            console.log(err);
        }
        fetch(BACKEND_URL + "/remove_all_facts_in_category", {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json;charset=utf-8'
            },
            mode: 'cors',
            body: JSON.stringify({id: catValue.value})
        }).then(response => {
            
        });
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

            });
        } catch (err) {
            console.log(err);
        }
    }

    return (
        <div className='AdminPage'>
            <button onClick={handleAllFactRemoval}>Remove All Facts</button>
            <button onClick={handleAllCatRemoval}>Remove All Categories</button>
            <Select options={categoryOptions} onChange={handleCatChange}/>
            <button onClick={handleRemoveCat}>Remove Selected Category</button>
            <button onClick={handleRemoveAllFactsOfCat}>Remove All Facts In Selected Category</button>
            <input type="text" onChange={handleNewCatNameChange}/>
            <button onClick={handleNewCategoryAdd}>Add New Category</button>
            <div className="allFacts">
                {allFacts.map((fact) => {
                    <div className="Fact" key={fact.id}>
                        <h1>{fact.title}</h1>
                        <p>{fact.description}</p>
                        <p>{fact.lat}</p>
                        <p>{fact.lng}</p>
                        <p>{getCatTitle(fact.category)}</p>
                        <p>{console.log(fact.title)}</p>
                    </div>
                })}
            </div>
        </div>
    )
}

export default AdminPage;