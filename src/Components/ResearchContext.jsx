import { createContext } from "react";

export const updateResearchContext = (values = {}) => ({ category: values });

const ResearchContext = createContext({

}
);

export const updateLocationContext = (values = {}) => ({ category: values });

const LocationContext = createContext({

}
);

export { 
    ResearchContext,
    LocationContext
};