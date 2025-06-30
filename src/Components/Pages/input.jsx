import { useContext, useEffect, useState } from 'react';
import ResearchContext from '../ResearchContext';
import Select from 'react-select';
import { BACKEND_URL } from '../../secrets';

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

    const allCategories = useContext(ResearchContext).allCategories;
    const userLoc = useContext(ResearchContext).currentLocation;

    useEffect(() => {
        categoriesToOptions();
    }, [allCategories]);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (titleValue === "") {
            // Tell the user they need to add a title
            console.log("Title needed");
            return;
        } else if (descValue === "") {
            // Tell the user they need to add a description
            console.log("Description needed");
            return;
        } else if (!catValue) {
            // Tell the user to pick a category, or possibly send it to a default category if that's preferred
            console.log("Category needed");
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

            });
        } catch(err) {
            console.log(err);
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

    return (
        <div className='InputPage'>
            <form className='fullForm' onSubmit={handleSubmit}>
                <label id='titleLabel'>
                    Title:
                    <input id='title' type='text' value={titleValue} onChange={handleTitleChange} />
                </label>

                <label id='descLabel'>
                    Description:
                    <input id='desc' type='text' value={descValue} onChange={handleDescChange} />
                </label>

                <Select name='catSelector' options={categoryOptions} onChange={handleCatChange}/>

                <input type="checkbox" checked={testChecked} onChange={handleCheckedChange}/>

                <input name='submitBtn' type='submit' value='Submit'/>
            </form>
        </div>
    )
}

export default InputPage;