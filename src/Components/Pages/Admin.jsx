import { useState, useEffect, useContext } from "react";
import Select from "react-select";
import ResearchContext from "../ResearchContext";

const AdminPage = ({

}) => {

    const [catValue, setCatValue] = useState(0);
    const [categoryOptions, setCategoryOptions] = useState([]);

    const allCategories = useContext(ResearchContext).allCategories;

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

    const handleAllFactRemoval = (event) => {
        fetch(BACKEND_URL + "/remove_all_facts", {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json;charset=utf-8'
            },
            mode: 'cors',
            body: JSON.stringify({title: titleValue, description: descValue, lat: 37.97336898429985, lng: -87.53240843750174, category: catValue.value})
        }).then(response => {
            
        });
    }

    const handleAllCatRemoval = (event) => {

    }

    const handleCatChange = (option) => {
        setCatValue(option);
    }

    const handleRemoveCat = (event) => {
        let localCat = catValue;



        handleRemoveAllFactsOfCat(localCat);
    }

    const handleRemoveAllFactsOfCat = (event) => {

    }

    return (
        <div className='AdminPage'>
            <button onClick={handleAllFactRemoval}>Remove All Facts</button>
            <button onClick={handleAllCatRemoval}>Remove All Categories</button>
            <Select options={categoryOptions} onChange={handleCatChange}/>
            <button onClick={handleRemoveCat}>Remove Selected Category</button>
            <button onClick={handleRemoveAllFactsOfCat}>Remove All Facts In Selected Category</button>
        </div>
    )
}

export default AdminPage;