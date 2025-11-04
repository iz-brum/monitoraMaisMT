import { createContext, useContext, useState } from "react";

const AnaErroContext = createContext();

export function useAnaErro() {
    return useContext(AnaErroContext);
}

export let setErroAnaGlobal = () => { };
export function AnaErroProvider({ children }) {
    const [erroAna, setErroAna] = useState(null);
    setErroAnaGlobal = setErroAna;

    return (
        <AnaErroContext.Provider value={{ erroAna, setErroAna }}>
            {children}
        </AnaErroContext.Provider>
    );
}