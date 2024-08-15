import { useState, ReactNode, createContext, useCallback, useMemo, useContext } from "react";

interface ClipboardContextType {
    hasImage: boolean,
    hasText: boolean,
    changeTypes: (hasText: boolean, hasImage: boolean) => void,
    setText: (text: string) => void,
}

const ClipboardContext = createContext<ClipboardContextType | undefined>(undefined)

export function useClipboard() {
    const context = useContext(ClipboardContext);
    if (context === undefined) {
        throw new Error('useClipboard must be used within a ClipboardProvider');
    }
    return context;
}

export const ClipboardProvider = ({ children, onSetText }: { children: ReactNode, onSetText: (text: string) => void }) => {
    const [hasImage, setHasImage] = useState(false)
    const [hasText, setHasText] = useState(false)

    const changeTypes = useCallback((hasText: boolean, hasImage: boolean) => {
        setHasText(hasText),
        setHasImage(hasImage)
    }, [])

    const setText = useCallback((text: string) => {
        onSetText(text)
    }, [])

    const value = useMemo(
        () => ({
            hasImage, hasText, changeTypes, setText,
        }),
        [hasImage, hasText, changeTypes, setText,]
    )    

    return <ClipboardContext.Provider value={value}>{children}</ClipboardContext.Provider>
}

