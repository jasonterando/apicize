import { Persisted, Persistence } from "@apicize/lib-typescript";
import { useState, ReactNode, createContext, useCallback, useMemo, useContext, useEffect, useRef } from "react";
import { useNavigationState } from "../navigation-state-context";
import { useNavigationContent } from "../navigation-content-context";
import { useWorkspace } from "../workspace-context";
import { NavigationType } from "../../models/store";
import { EditableNameValuePair } from "../../models/workbook/editable-name-value-pair";

interface ScenarioEditorContextType {
    id: string,
    name: string,
    persistence: Persistence,
    variables: EditableNameValuePair[],
    changeName: (value: string) => void,
    changePersistence: (value: Persistence) => void,
    changeVariables: (value: EditableNameValuePair[]) => void,
}

const ScenarioEditorContext = createContext<ScenarioEditorContextType | undefined>(undefined)

export function useScenarioEditor() {
    const context = useContext(ScenarioEditorContext);
    if (context === undefined) {
        throw new Error('useScenarioEditor must be used within a ScenarioEditorProvider');
    }
    return context;
}

export const ScenarioEditorProvider = ({ children }: { children: ReactNode }) => {

    const workspaceCtx = useWorkspace()
    const navState = useNavigationState()

    let scenario = (navState.activeType === NavigationType.Scenario && navState.activeId && navState.activeId.length > 0) 
        ? workspaceCtx.scenario.getScenario(navState.activeId)
        : undefined
        
    const [id, setId] = useState(scenario?.id ?? '')
    const [name, setName] = useState(scenario?.name ?? '')
    const [persistence, setPersistence] = useState(scenario?.persistence ?? Persistence.Private)
    const [variables, setVariables] = useState(scenario?.variables ?? [])

    console.log(`Initializing scenario ${navState.activeId} name to ${scenario?.name ?? '(none)'}`)

    const isFirstRender = useRef(true)
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false
            return // return early if first render
        }
        scenario = (navState.activeType === NavigationType.Scenario && navState.activeId && navState.activeId.length > 0)
            ? workspaceCtx.scenario.getScenario(navState.activeId)
            : undefined
        setId(scenario?.id ?? '')
        console.log(`Updating scenario ${navState.activeId} name to ${scenario?.name ?? '(none)'}`)
        setName(scenario?.name ?? '')
        setPersistence(scenario?.persistence ?? Persistence.Private)
        setVariables(scenario?.variables ?? [])
    }, [navState.activeType, navState.activeId])

    const changeName = useCallback((name: string) => {
        setName(name)
        workspaceCtx.proxy?.setName(id, name)
    }, [id])

    const changePersistence = useCallback((persistence: Persistence) => {
        setPersistence(persistence)
        workspaceCtx.proxy?.setPersistence(id, persistence)
    }, [id])

    const changeVariables = useCallback((variables: EditableNameValuePair[]) => {
        setVariables(variables)
        workspaceCtx.scenario?.setVariables(id, variables)
    }, [id])

    const value = useMemo(
        () => ({
            id, name, persistence, variables, changeName, changePersistence, changeVariables,
        }),
        [id, name, persistence, variables, changeName, changePersistence, changeVariables,]
    )    

    return <ScenarioEditorContext.Provider value={value}>
        {id.length > 0 ? children : <></>}
    </ScenarioEditorContext.Provider>
}

