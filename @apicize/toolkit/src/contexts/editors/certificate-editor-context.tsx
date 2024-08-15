import { Persistence, WorkbookAuthorizationType, WorkbookCertificateType, WorkbookPkcs12Certificate, WorkbookPkcs8PemCertificate } from "@apicize/lib-typescript";
import { useState, useEffect, ReactNode, createContext, useCallback, useMemo, useContext, useRef } from "react";
import { useWorkspace } from "../workspace-context";
import { useNavigationState } from "../navigation-state-context";
import { NavigationType } from "../../models/store";

interface CertificateEditorContextType {
    id: string,
    name: string,
    persistence: Persistence,
    type: WorkbookCertificateType,
    pem: string,
    key: string,
    pfx: string,
    password: string,
    changeName: (value: string) => void,
    changePersistence: (value: Persistence) => void,
    changeType: (value: WorkbookCertificateType) => void,
    changePem: (value: string) => void,
    changeKey: (value: string) => void,
    changePfx: (value: string) => void,
    changePassword: (value: string) => void,
}

const CertificateEditorContext = createContext<CertificateEditorContextType | undefined>(undefined)

export function useCertificateEditor() {
    const context = useContext(CertificateEditorContext);
    if (context === undefined) {
        throw new Error('useCetificateEditor must be used within a CertificateEditorProvider');
    }
    return context;
}

export const CertificateEditorProvider = ({ children }: { children: ReactNode }) => {

    const workspaceCtx = useWorkspace()
    const navState = useNavigationState()

    let cert = (navState.activeType === NavigationType.Certificate && navState.activeId && navState.activeId.length > 0) 
        ? workspaceCtx.certificate.getCertificate(navState.activeId)
        : undefined

    const [id, setId] = useState(cert?.id ?? '')
    const [name, setName] = useState(cert?.name ?? '')
    const [persistence, setPersistence] = useState(cert?.persistence ?? Persistence.Private)
    const [type, setType] = useState(cert?.type ?? WorkbookCertificateType.PEM)
    const [pem, setPem] = useState((cert as WorkbookPkcs8PemCertificate)?.pem ?? '')
    const [key, setKey] = useState((cert as WorkbookPkcs8PemCertificate)?.key ?? '')
    const [pfx, setPfx] = useState((cert as WorkbookPkcs12Certificate)?.pfx ?? '')
    const [password, setPassword] = useState((cert as WorkbookPkcs12Certificate)?.password ?? '')

    const isFirstRender = useRef(true)
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false
            return // return early if first render
        }
        cert = (navState.activeType === NavigationType.Certificate && navState.activeId && navState.activeId.length > 0)
            ? workspaceCtx.certificate.getCertificate(navState.activeId)
            : undefined
        setId(cert?.id ?? '')
        setName(cert?.name ?? '')
        setPersistence(cert?.persistence ?? Persistence.Private)
        setType(cert?.type ?? WorkbookCertificateType.PEM)
        setPem((cert as WorkbookPkcs8PemCertificate)?.pem ?? '')
        setKey((cert as WorkbookPkcs8PemCertificate)?.key ?? '')
        setPfx((cert as WorkbookPkcs12Certificate)?.pfx ?? '')
        setPassword((cert as WorkbookPkcs12Certificate)?.password ?? '')
    }, [navState.activeType, navState.activeId])

    const changeName = useCallback((value: string) => {
        setName(value)
        workspaceCtx.certificate.setName(id, value)
    }, [id])

    const changePersistence = useCallback((value: Persistence) => {
        setPersistence(value)
        workspaceCtx.certificate.setPersistence(id, value)
    }, [id])

    const changeType = useCallback((value: WorkbookCertificateType) => {
        setType(value)
        workspaceCtx.certificate.setType(id, value)
    }, [id])

    const changePem = useCallback((value: string) => {
        setPem(value)
        workspaceCtx.certificate.setPem(id, value)
    }, [id])

    const changeKey = useCallback((value: string) => {
        setKey(value)
        workspaceCtx.certificate.setKey(id, value)
    }, [id])

    const changePfx = useCallback((value: string) => {
        setPfx(value)
        workspaceCtx.certificate.setPfx(id, value)
    }, [id])

    const changePassword = useCallback((value: string) => {
        setPassword(value)
        workspaceCtx.certificate.setPassword(id, value)
    }, [id])


    const value = useMemo(
        () => ({
            id, name, persistence, type, pem, key, pfx, password,
            changeName, changePersistence, changeType, changePem, changeKey, changePfx, changePassword,
        }),
        [
            id, name, persistence, type, pem, key, pfx, password,
            changeName, changePersistence, changeType, changePem, changeKey, changePfx, changePassword,
        ]
    )

    return <CertificateEditorContext.Provider value={value}>
        {id.length > 0 ? children : <></>}
    </CertificateEditorContext.Provider>
}
