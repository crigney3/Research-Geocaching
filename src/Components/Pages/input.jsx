import { useContext, useEffect, useState } from 'react';
import ResearchContext from '../ResearchContext';
import Select from 'react-select';
import { BACKEND_URL } from '../../secrets';

const InputPage = ({
    
}) => {
    const [titleValue, setTitleValue] = useState("");
    const [descValue, setDescValue] = useState("");
    const [catValue, setCatValue] = useState(0);
    const [categoryOptions, setCategoryOptions] = useState([]);

    const allCategories = useContext(ResearchContext).allCategories;

    useEffect(() => {
        categoriesToOptions();
    }, [allCategories]);

    const handleSubmit = (event) => {
        event.preventDefault();

        if (titleValue === "") {
            // Tell the user they need to add a title
            return;
        } else if (descValue === "") {
            // Tell the user they need to add a description
            return;
        } else if (!catValue) {
            // Tell the user to pick a category, or possibly send it to a default category if that's preferred
            return;
        }

        fetch(BACKEND_URL + "/add_fact", {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json;charset=utf-8'
            },
            mode: 'cors',
            body: JSON.stringify({title: titleValue, description: descValue, lat: 37.97336898429985, lng: -87.53240843750174, category: catValue.value})
        }).then(response => {
            
        });
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

                <input name='submitBtn' type='submit' value='Submit'/>
            </form>
        </div>
    )
}

export default InputPage;