import { useState, ReactNode, createContext, useCallback, useMemo, useContext } from "react";

interface HelpContextType {
    showHelp: boolean,
    helpTopic: string,
    nextHelpTopic: string,
    helpText: string,
    helpTopicHistory: string[],
    help: (topic: string, text: string, history: string[]) => void,
    hideHelp: () => void,
    changeNextHelpTopic: (topic: string) => void,
}

const HelpContext = createContext<HelpContextType | undefined>(undefined)

export function useHelp() {
    const context = useContext(HelpContext);
    if (context === undefined) {
        throw new Error('useHelp must be used within a HelpProvider');
    }
    return context;
}

export const HelpProvider = ({ children }: { children: ReactNode }) => {
    const [showHelp, setShowHelp] = useState(false)
    const [helpTopic, setHelpTopic] = useState('')
    const [nextHelpTopic, setNextHelpTopic] = useState('')
    const [helpText, setHelpText] = useState('')
    const [helpTopicHistory, setHelpTopicHistory] = useState<string[]>([])

    const help = useCallback((topic: string, text: string, history: string[]) => {
        setHelpTopic(topic)
        setHelpText(text)
        setHelpTopicHistory(history)
        setShowHelp(true)
    }, [])

    const hideHelp = useCallback(() => {
        setShowHelp(false)
    }, [])

    const changeNextHelpTopic = useCallback((topic: string) => {
        setNextHelpTopic(topic)
    }, [])

    const value = {
        showHelp, helpTopic, nextHelpTopic, helpText, helpTopicHistory,
        help, hideHelp, changeNextHelpTopic,
    }
    // const value = useMemo(
    //     () => ({
    //         showHelp, helpTopic, nextHelpTopic, helpText, helpTopicHistory,
    //         help, hideHelp, changeNextHelpTopic,
    //     }),
    //     [showHelp, helpTopic, nextHelpTopic, helpText, helpTopicHistory,
    //         help, hideHelp, changeNextHelpTopic,]
    // )

    return <HelpContext.Provider value={value}>{children}</HelpContext.Provider>
}

