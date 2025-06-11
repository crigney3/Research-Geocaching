import { createContext } from "react";

export const updateResearchContext = (values = {}) => ({ category: values });

const ResearchContext = createContext({

}
);

export default  ResearchContext;