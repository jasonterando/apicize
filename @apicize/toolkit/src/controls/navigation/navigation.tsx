import MoreVertIcon from '@mui/icons-material/MoreVert';
import FolderIcon from '@mui/icons-material/Folder'
import FileOpenIcon from '@mui/icons-material/FileOpen'
import PostAddIcon from '@mui/icons-material/PostAdd'
import SaveIcon from '@mui/icons-material/Save'
import SaveAsIcon from '@mui/icons-material/SaveAs'
import HelpIcon from '@mui/icons-material/Help'
import SendIcon from '@mui/icons-material/Send'
import LockIcon from '@mui/icons-material/Lock'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import AirlineStopsIcon from '@mui/icons-material/AirlineStops';
import SecurityIcon from '@mui/icons-material/Security';
import DeleteIcon from '@mui/icons-material/DeleteOutlined'
import LanguageIcon from '@mui/icons-material/Language'
import { TreeView } from '@mui/x-tree-view/TreeView'
import { TreeItem } from '@mui/x-tree-view/TreeItem'
import { Box, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Stack } from '@mui/material'
import { NavigationType } from '../../models/store'
import AddIcon from '@mui/icons-material/Add'
import React, { ReactNode, SyntheticEvent, useContext, useState } from 'react'
import { useConfirmation } from '../../services/confirmation-service'
import { DndContext, DragEndEvent, useDraggable, useDroppable, useSensors, useSensor, PointerSensor, DragCancelEvent, DragMoveEvent } from '@dnd-kit/core'
import { GetTitle } from '@apicize/lib-typescript';
import { CSS, useCombinedRefs } from '@dnd-kit/utilities';
import { useWorkspace } from '../../contexts/workspace-context';
import { NavigationListItem } from '../../models/navigation-list-item';
import { useWindow } from '../../contexts/window-context';
import { useNavigationContent } from '../../contexts/navigation-content-context';

interface MenuPosition {
    id: string
    mouseX: number
    mouseY: number
}


// function md5(inputString: string) {
//     var hc = "0123456789abcdef";
//     function rh(n: number) { var j, s = ""; for (j = 0; j <= 3; j++) s += hc.charAt((n >> (j * 8 + 4)) & 0x0F) + hc.charAt((n >> (j * 8)) & 0x0F); return s; }
//     function ad(x: number, y: number) { var l = (x & 0xFFFF) + (y & 0xFFFF); var m = (x >> 16) + (y >> 16) + (l >> 16); return (m << 16) | (l & 0xFFFF); }
//     function rl(n: number, c: number) { return (n << c) | (n >>> (32 - c)); }
//     function cm(q: number, a: number, b: number, x: number, s: number, t: number) { return ad(rl(ad(ad(a, q), ad(x, t)), s), b); }
//     function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return cm((b & c) | ((~b) & d), a, b, x, s, t); }
//     function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return cm((b & d) | (c & (~d)), a, b, x, s, t); }
//     function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return cm(b ^ c ^ d, a, b, x, s, t); }
//     function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return cm(c ^ (b | (~d)), a, b, x, s, t); }
//     function sb(x: string) {
//         var i; var nblk = ((x.length + 8) >> 6) + 1; var blks = new Array(nblk * 16); for (i = 0; i < nblk * 16; i++) blks[i] = 0;
//         for (i = 0; i < x.length; i++) blks[i >> 2] |= x.charCodeAt(i) << ((i % 4) * 8);
//         blks[i >> 2] |= 0x80 << ((i % 4) * 8); blks[nblk * 16 - 2] = x.length * 8; return blks;
//     }
//     var i, x = sb("" + inputString), a = 1732584193, b = -271733879, c = -1732584194, d = 271733878, olda, oldb, oldc, oldd;
//     for (i = 0; i < x.length; i += 16) {
//         olda = a; oldb = b; oldc = c; oldd = d;
//         a = ff(a, b, c, d, x[i + 0], 7, -680876936); d = ff(d, a, b, c, x[i + 1], 12, -389564586); c = ff(c, d, a, b, x[i + 2], 17, 606105819);
//         b = ff(b, c, d, a, x[i + 3], 22, -1044525330); a = ff(a, b, c, d, x[i + 4], 7, -176418897); d = ff(d, a, b, c, x[i + 5], 12, 1200080426);
//         c = ff(c, d, a, b, x[i + 6], 17, -1473231341); b = ff(b, c, d, a, x[i + 7], 22, -45705983); a = ff(a, b, c, d, x[i + 8], 7, 1770035416);
//         d = ff(d, a, b, c, x[i + 9], 12, -1958414417); c = ff(c, d, a, b, x[i + 10], 17, -42063); b = ff(b, c, d, a, x[i + 11], 22, -1990404162);
//         a = ff(a, b, c, d, x[i + 12], 7, 1804603682); d = ff(d, a, b, c, x[i + 13], 12, -40341101); c = ff(c, d, a, b, x[i + 14], 17, -1502002290);
//         b = ff(b, c, d, a, x[i + 15], 22, 1236535329); a = gg(a, b, c, d, x[i + 1], 5, -165796510); d = gg(d, a, b, c, x[i + 6], 9, -1069501632);
//         c = gg(c, d, a, b, x[i + 11], 14, 643717713); b = gg(b, c, d, a, x[i + 0], 20, -373897302); a = gg(a, b, c, d, x[i + 5], 5, -701558691);
//         d = gg(d, a, b, c, x[i + 10], 9, 38016083); c = gg(c, d, a, b, x[i + 15], 14, -660478335); b = gg(b, c, d, a, x[i + 4], 20, -405537848);
//         a = gg(a, b, c, d, x[i + 9], 5, 568446438); d = gg(d, a, b, c, x[i + 14], 9, -1019803690); c = gg(c, d, a, b, x[i + 3], 14, -187363961);
//         b = gg(b, c, d, a, x[i + 8], 20, 1163531501); a = gg(a, b, c, d, x[i + 13], 5, -1444681467); d = gg(d, a, b, c, x[i + 2], 9, -51403784);
//         c = gg(c, d, a, b, x[i + 7], 14, 1735328473); b = gg(b, c, d, a, x[i + 12], 20, -1926607734); a = hh(a, b, c, d, x[i + 5], 4, -378558);
//         d = hh(d, a, b, c, x[i + 8], 11, -2022574463); c = hh(c, d, a, b, x[i + 11], 16, 1839030562); b = hh(b, c, d, a, x[i + 14], 23, -35309556);
//         a = hh(a, b, c, d, x[i + 1], 4, -1530992060); d = hh(d, a, b, c, x[i + 4], 11, 1272893353); c = hh(c, d, a, b, x[i + 7], 16, -155497632);
//         b = hh(b, c, d, a, x[i + 10], 23, -1094730640); a = hh(a, b, c, d, x[i + 13], 4, 681279174); d = hh(d, a, b, c, x[i + 0], 11, -358537222);
//         c = hh(c, d, a, b, x[i + 3], 16, -722521979); b = hh(b, c, d, a, x[i + 6], 23, 76029189); a = hh(a, b, c, d, x[i + 9], 4, -640364487);
//         d = hh(d, a, b, c, x[i + 12], 11, -421815835); c = hh(c, d, a, b, x[i + 15], 16, 530742520); b = hh(b, c, d, a, x[i + 2], 23, -995338651);
//         a = ii(a, b, c, d, x[i + 0], 6, -198630844); d = ii(d, a, b, c, x[i + 7], 10, 1126891415); c = ii(c, d, a, b, x[i + 14], 15, -1416354905);
//         b = ii(b, c, d, a, x[i + 5], 21, -57434055); a = ii(a, b, c, d, x[i + 12], 6, 1700485571); d = ii(d, a, b, c, x[i + 3], 10, -1894986606);
//         c = ii(c, d, a, b, x[i + 10], 15, -1051523); b = ii(b, c, d, a, x[i + 1], 21, -2054922799); a = ii(a, b, c, d, x[i + 8], 6, 1873313359);
//         d = ii(d, a, b, c, x[i + 15], 10, -30611744); c = ii(c, d, a, b, x[i + 6], 15, -1560198380); b = ii(b, c, d, a, x[i + 13], 21, 1309151649);
//         a = ii(a, b, c, d, x[i + 4], 6, -145523070); d = ii(d, a, b, c, x[i + 11], 10, -1120210379); c = ii(c, d, a, b, x[i + 2], 15, 718787259);
//         b = ii(b, c, d, a, x[i + 9], 21, -343485551); a = ad(a, olda); b = ad(b, oldb); c = ad(c, oldc); d = ad(d, oldd);
//     }
//     return rh(a) + rh(b) + rh(c) + rh(d);
// }

export function Navigation(props: {
    triggerNew: () => void,
    triggerOpen: () => void,
    triggerSave: () => void,
    triggerSaveAs: () => void,
    triggerHelp: (topic?: string) => void
}) {

    const workspaceCtx = useWorkspace()
    const navigationContentCtx = useNavigationContent()
    const windowCtx = useWindow()
    const confirm = useConfirmation()

    const [requestsMenu, setRequestsMenu] = useState<MenuPosition | undefined>(undefined)
    const [reqMenu, setReqMenu] = useState<MenuPosition | undefined>(undefined)
    const [authMenu, setAuthMenu] = useState<MenuPosition | undefined>(undefined)
    const [scenarioMenu, setScenarioMenu] = useState<MenuPosition | undefined>(undefined)
    const [certMenu, setCertMenu] = useState<MenuPosition | undefined>(undefined)
    const [proxyMenu, setProxyMenu] = useState<MenuPosition | undefined>(undefined)

    enum DragPosition {
        None = 'NONE',
        Left = 'LEFT',
        Upper = 'UPPER',
        Lower = 'LOWER',
        Invalid = 'INVALID'
    }

    const [dragPosition, setDragPosition] = useState(DragPosition.None)

    const dragPositionToColor = (dragPosition: DragPosition) => {
        switch (dragPosition) {
            case DragPosition.Upper:
                return "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(128,128,128,1) 25%, rgba(64,64,64,1) 75%);"
            case DragPosition.Lower:
                return "linear-gradient(0deg, rgba(255,255,255,1) 0%, rgba(128,128,128,1) 25%, rgba(64,64,64,1) 75%);"
            case DragPosition.Left:
                return "linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(128,128,128,1) 13%, rgba(64,64,64,1) 44%);"
            case DragPosition.Invalid:
                return 'rgba(128, 0, 0, 0.5)'
            default:
                return 'default'
        }
    }

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8
            }
        })
    )

    interface DraggableData {
        type: string,
        move: (destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) => void
    }

    interface DroppableData {
        isHeader: boolean
        acceptsType: string
        depth: number
    }

    function NavTreeSection(props: {
        children?: ReactNode | undefined
        type: string
        title: string
        helpTopic: string
        onAdd: () => void
    }) {
        const { isOver, setNodeRef: setDropRef } = useDroppable({
            id: `hdr-${props.type}`,
            data: {
                isHeader: true,
                acceptsType: props.type
            } as DroppableData
        })

        return (<TreeItem
            nodeId={`hdr-${props.type}`}
            key={`hdr-${props.type}`}
            id={`hdr-${props.type}`}
            onClick={e => handleSelectHeader(e, props.helpTopic)}
            onFocusCapture={e => e.stopPropagation()}
            label={(
                <Box
                    component='span'
                    display='flex'
                    justifyContent='space-between'
                    alignItems='center'
                    ref={setDropRef}
                    onClick={(e) => {
                        // Prevent label from expanding/collapsing
                        handleSelectHeader(e, props.helpTopic)
                    }}
                    sx={{ background: isOver ? dragPositionToColor(dragPosition) : 'default' }}
                >
                    {
                        props.type === 'request' ? (<SendIcon sx={{ flexGrow: 0, marginRight: '10px' }} />) :
                            props.type === 'auth' ? (<LockIcon sx={{ flexGrow: 0, marginRight: '10px' }} />) :
                                props.type === 'scenario' ? (<LanguageIcon sx={{ flexGrow: 0, marginRight: '10px' }} />) :
                                    props.type === 'proxy' ? (<AirlineStopsIcon sx={{ flexGrow: 0, marginRight: '10px' }} />) :
                                        props.type === 'cert' ? (<SecurityIcon sx={{ flexGrow: 0, marginRight: '10px' }} />) :
                                            (<></>)
                    }
                    <Box className='nav-node-text' sx={{ flexGrow: 1 }}>
                        {props.title}
                    </Box>
                    {
                        props.type === 'request' ?
                            (
                                <IconButton sx={{ flexGrow: 0, minHeight: '40px' }} onClick={(e) => handleShowRequestsMenu(e, 'menu-auth')}>
                                    <MoreVertIcon />
                                </IconButton>
                            )
                            :
                            (
                                <IconButton sx={{ flexGrow: 0, minHeight: '40px' }}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        props.onAdd()
                                    }}>
                                    <AddIcon />
                                </IconButton>
                            )
                    }
                </Box>
            )}>
            {props.children}
        </TreeItem>
        )
    }

    function NavTreeItem(props: {
        type: string,
        item: NavigationListItem,
        depth: number,
        onSelect?: (id: string) => void,
        onMenu?: (event: React.MouseEvent, id: string) => void,
        onMove?: (id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) => void
    }) {
        const { attributes, listeners, setNodeRef: setDragRef, transform } = useDraggable({
            id: props.item.id,
            data: {
                type: props.type,
                move: (destinationID: string, onLowerHalf: boolean, onLeft: boolean) => {
                    if (props.onMove) {
                        props.onMove(props.item.id, destinationID, onLowerHalf, onLeft)
                    }
                }
            } as DraggableData
        })

        const dragStyle = {
            transform: CSS.Translate.toString(transform)
        }

        const { isOver, setNodeRef: setDropRef } = useDroppable({
            id: props.item.id,
            data: {
                isHeader: false,
                acceptsType: props.type,
                depth: props.depth
            } as DroppableData
        })

        return Array.isArray(props.item.children)
            ?
            (
                <TreeItem
                    nodeId={props.item.id}
                    {...listeners}
                    {...attributes}
                    sx={{ background: isOver ? dragPositionToColor(dragPosition) : 'default' }}
                    onClick={(e) => {
                        // Prevent label from expanding/collapsing
                        e.preventDefault()
                        e.stopPropagation()
                        if (props.onSelect) props.onSelect(props.item.id)
                    }}
                    onFocusCapture={e => e.stopPropagation()}
                    label={(
                        <Box
                            key={props.item.id}
                            id={props.item.id}
                            ref={useCombinedRefs(setDragRef, setDropRef)}
                            style={dragStyle}
                            component='span'
                            display='flex'
                            justifyContent='space-between'
                            alignItems='center'
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                if (props.onSelect) props.onSelect(props.item.id)
                            }}
                        >
                            <FolderIcon sx={{ flexGrow: 0, marginRight: '10px' }} />
                            <Box className='nav-node-text' sx={{ flexGrow: 1 }}>{GetTitle(props.item)}</Box>
                            <IconButton
                                sx={{
                                    visibility: props.item.id === navigationContentCtx.activeId ? 'normal' : 'hidden'
                                }}
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    if (props.onMenu) props.onMenu(e, props.item.id)
                                }}
                            >
                                <MoreVertIcon />
                            </IconButton>
                        </Box>
                    )}>
                    {props.item.children.map(c => (
                        <NavTreeItem
                            type={props.type}
                            depth={props.depth + 1}
                            item={c}
                            key={`nav-${c.id}`}
                            onSelect={props.onSelect}
                            onMenu={props.onMenu}
                            onMove={props.onMove}
                        />
                    ))}
                </TreeItem>
            )
            :
            (<TreeItem
                nodeId={props.item.id}
                key={props.item.id}
                ref={useCombinedRefs(setDragRef, setDropRef)}
                id={props.item.id}
                style={dragStyle}
                {...listeners}
                {...attributes}
                onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (props.onSelect) props.onSelect(props.item.id)
                }}
                onFocusCapture={e => e.stopPropagation()}
                sx={{ background: isOver ? dragPositionToColor(dragPosition) : 'default' }}
                label={(
                    <Box
                        component='span'
                        display='flex'
                        justifyContent='space-between'
                        alignItems='center'
                        onFocusCapture={e => e.stopPropagation()}
                    >
                        {
                            Array.isArray(props.item.children)
                                ? <FolderIcon sx={{ flexGrow: 0, marginRight: '10px' }} />
                                : null
                        }
                        <Box className='nav-node-text' sx={{ verticalAlign: 'middle' }}>{GetTitle(props.item)}</Box>
                        <IconButton
                            sx={{
                                visibility: props.item.id === navigationContentCtx.activeId ? 'normal' : 'hidden'
                            }}
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                if (props.onMenu) props.onMenu(e, props.item.id)
                            }}
                        >
                            <MoreVertIcon />
                        </IconButton>
                    </Box>
                )} />)
    }

    const clearAllSelections = () => {
        workspaceCtx.workbook.clearAllActivations()
    }

    const closeRequestsMenu = () => {
        setRequestsMenu(undefined)
    }

    const closeRequestMenu = () => {
        setReqMenu(undefined)
    }

    const closeScenarioMenu = () => {
        setScenarioMenu(undefined)
    }

    const closeAuthMenu = () => {
        setAuthMenu(undefined)
    }

    const closeCertMenu = () => {
        setCertMenu(undefined)
    }

    const closeProxyMenu = () => {
        setProxyMenu(undefined)
    }

    const handleShowRequestsMenu = (event: React.MouseEvent, id: string) => {
        event.preventDefault()
        event.stopPropagation()
        setRequestsMenu(
            {
                id,
                mouseX: event.clientX - 1,
                mouseY: event.clientY - 6,
            }
        )
    }

    const handleShowRequestMenu = (event: React.MouseEvent, id: string) => {
        event.preventDefault()
        event.stopPropagation()
        setReqMenu(
            {
                id,
                mouseX: event.clientX - 1,
                mouseY: event.clientY - 6,
            }
        )
    }

    const handleShowScenarioMenu = (event: React.MouseEvent, id: string) => {
        event.preventDefault()
        event.stopPropagation()
        setScenarioMenu(
            {
                id,
                mouseX: event.clientX - 1,
                mouseY: event.clientY - 6,
            }
        )
    }

    const handleShowAuthMenu = (event: React.MouseEvent, id: string) => {
        event.preventDefault()
        event.stopPropagation()
        setAuthMenu(
            {
                id,
                mouseX: event.clientX - 1,
                mouseY: event.clientY - 6,
            }
        )
    }

    const handleShowCertMenu = (event: React.MouseEvent, id: string) => {
        event.preventDefault()
        event.stopPropagation()
        setCertMenu(
            {
                id,
                mouseX: event.clientX - 1,
                mouseY: event.clientY - 6,
            }
        )
    }

    const handleShowProxyMenu = (event: React.MouseEvent, id: string) => {
        event.preventDefault()
        event.stopPropagation()
        setProxyMenu(
            {
                id,
                mouseX: event.clientX - 1,
                mouseY: event.clientY - 6,
            }
        )
    }

    const closeAllMenus = () => {
        closeRequestsMenu()
        closeRequestMenu()
        closeScenarioMenu()
        closeAuthMenu()
        closeCertMenu()
        closeProxyMenu()
    }

    const handleSelectHeader = (e: SyntheticEvent, helpTopic?: string) => {
        e.preventDefault()
        e.stopPropagation()
        closeAllMenus()
        if (helpTopic) {
            props.triggerHelp(helpTopic)
        }
    }

    const showHelp = () => {
        closeAllMenus()
        props.triggerHelp()

    }

    const selectRequest = (id: string) => {
        workspaceCtx.workbook.activateRequestOrGroup(id)
    }

    const selectScenario = (id: string) => {
        workspaceCtx.workbook.activateScenario(id)
    }

    const selectAuthorization = (id: string) => {
        workspaceCtx.workbook.activateAuthorization(id)
    }

    const selectCertificate = (id: string) => {
        workspaceCtx.workbook.activateCertificate(id)
    }

    const selectProxy = (id: string) => {
        workspaceCtx.workbook.activateProxy(id)
    }

    const handleAddRequest = (targetRequestId?: string | null) => {
        closeRequestsMenu()
        closeRequestMenu()
        workspaceCtx.request.add(targetRequestId)
    }

    const handleAddRequestGroup = (targetRequestId?: string | null) => {
        closeRequestsMenu()
        closeRequestMenu()
        workspaceCtx.group.add(targetRequestId)
    }

    const handleAddScenario = (targetScenarioId?: string | null) => {
        closeScenarioMenu()
        workspaceCtx.scenario.add(targetScenarioId)
    }

    const handleAddAuth = (targetAuthId?: string | null) => {
        closeAuthMenu()
        workspaceCtx.authorization.add(targetAuthId)
    }
    const handleAddCert = (targetCertId?: string | null) => {
        closeCertMenu()
        workspaceCtx.certificate.add(targetCertId)
    }

    const handleAddProxy = (targetProxyId?: string | null) => {
        closeProxyMenu()
        workspaceCtx.proxy.add(targetProxyId)
    }

    const handleDeleteRequest = () => {
        closeRequestMenu()
        closeRequestsMenu()
        if (!navigationContentCtx.activeId || (navigationContentCtx.activeType !== NavigationType.Request && navigationContentCtx.activeType !== NavigationType.Group)) return
        const id = navigationContentCtx.activeId
        confirm({
            title: 'Delete Request',
            message: `Are you are you sure you want to delete ${GetTitle(navigationContentCtx.requestList.find(r => r.id === id))}?`,
            okButton: 'Yes',
            cancelButton: 'No',
            defaultToCancel: true
        }).then((result) => {
            if (result) {
                clearAllSelections()
                workspaceCtx.request.delete(id)
            }
        })
    }

    const handleDeleteScenario = () => {
        closeScenarioMenu()
        if (!navigationContentCtx.activeId || navigationContentCtx.activeType !== NavigationType.Scenario) return
        const id = navigationContentCtx.activeId
        confirm({
            title: 'Delete Scenario',
            message: `Are you are you sure you want to delete ${GetTitle(navigationContentCtx.scenarioList.find(s => s.id === id))}?`,
            okButton: 'Yes',
            cancelButton: 'No',
            defaultToCancel: true
        }).then((result) => {
            if (result) {
                clearAllSelections()
                workspaceCtx.scenario.delete(id)
            }
        })
    }

    const handleDeleteAuth = () => {
        closeAuthMenu()
        if (!navigationContentCtx.activeId || navigationContentCtx.activeType !== NavigationType.Authorization) return
        const id = navigationContentCtx.activeId
        confirm({
            title: 'Delete Authorization',
            message: `Are you are you sure you want to delete ${GetTitle(navigationContentCtx.authorizationList.find(a => a.id === id))}?`,
            okButton: 'Yes',
            cancelButton: 'No',
            defaultToCancel: true
        }).then((result) => {
            if (result) {
                clearAllSelections()
                workspaceCtx.authorization.delete(id)
            }
        })
    }

    const handleDeleteCert = () => {
        closeCertMenu()
        if (!navigationContentCtx.activeId || navigationContentCtx.activeType !== NavigationType.Certificate) return
        const id = navigationContentCtx.activeId
        confirm({
            title: 'Delete Certificate',
            message: `Are you are you sure you want to delete ${GetTitle(navigationContentCtx.certificateList.find(s => s.id === id))}?`,
            okButton: 'Yes',
            cancelButton: 'No',
            defaultToCancel: true
        }).then((result) => {
            if (result) {
                clearAllSelections()
                workspaceCtx.certificate.delete(id)
            }
        })
    }
    const handleDeleteProxy = () => {
        closeProxyMenu()
        if (!navigationContentCtx.activeId || navigationContentCtx.activeType !== NavigationType.Proxy) return
        const id = navigationContentCtx.activeId
        confirm({
            title: 'Delete Proxy',
            message: `Are you are you sure you want to delete ${GetTitle(navigationContentCtx.proxyList.find(s => s.id === id))}?`,
            okButton: 'Yes',
            cancelButton: 'No',
            defaultToCancel: true
        }).then((result) => {
            if (result) {
                clearAllSelections()
                workspaceCtx.proxy.delete(id)
            }
        })
    }

    const handleDupeRequest = () => {
        closeRequestMenu()
        closeRequestsMenu()
        if (navigationContentCtx.activeType === NavigationType.Request && navigationContentCtx.activeId) workspaceCtx.request.copy(navigationContentCtx.activeId)
    }

    const handleDupeScenario = () => {
        closeScenarioMenu()
        if (navigationContentCtx.activeType === NavigationType.Scenario && navigationContentCtx.activeId) workspaceCtx.scenario.copy(navigationContentCtx.activeId)
    }

    const handleDupeAuth = () => {
        closeAuthMenu()
        if (navigationContentCtx.activeType === NavigationType.Authorization && navigationContentCtx.activeId) workspaceCtx.authorization.copy(navigationContentCtx.activeId)
    }

    const handleDupeCert = () => {
        closeCertMenu()
        if (navigationContentCtx.activeType === NavigationType.Certificate && navigationContentCtx.activeId) workspaceCtx.certificate.copy(navigationContentCtx.activeId)
    }

    const handleDupeProxy = () => {
        closeProxyMenu()
        if (navigationContentCtx.activeType === NavigationType.Proxy && navigationContentCtx.activeId) workspaceCtx.proxy.copy(navigationContentCtx.activeId)
    }

    const handleMoveRequest = (id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) => {
        selectRequest(id)
        workspaceCtx.request.move(id, destinationID, onLowerHalf, onLeft)
    }

    const handleMoveScenario = (id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) => {
        selectScenario(id)
        workspaceCtx.scenario.move(id, destinationID, onLowerHalf, onLeft)
    }

    const handleMoveAuth = (id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) => {
        selectAuthorization(id)
        workspaceCtx.authorization.move(id, destinationID, onLowerHalf, onLeft)
    }

    const handleMoveCert = (id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) => {
        selectCertificate(id)
        workspaceCtx.certificate.move(id, destinationID, onLowerHalf, onLeft)
    }

    const handleMoveProxy = (id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) => {
        selectProxy(id)
        workspaceCtx.proxy.move(id, destinationID, onLowerHalf, onLeft)
    }

    function RequestsMenu() {
        return (
            <Menu
                id='requests-menu'
                open={requestsMenu !== undefined}
                onClose={closeRequestsMenu}
                anchorReference='anchorPosition'
                anchorPosition={{
                    top: requestsMenu?.mouseY ?? 0,
                    left: requestsMenu?.mouseX ?? 0
                }}
            >
                <MenuItem className='navigation-menu-item' onClick={(_) => handleAddRequest(navigationContentCtx.activeId)}>
                    <ListItemIcon>
                        <SendIcon fontSize='small' />
                    </ListItemIcon>
                    <ListItemText>Add Request</ListItemText>
                </MenuItem>
                <MenuItem className='navigation-menu-item' onClick={(_) => handleAddRequestGroup(navigationContentCtx.activeId)}>
                    <ListItemIcon>
                        <FolderIcon fontSize='small' />
                    </ListItemIcon>
                    <ListItemText>Add Group</ListItemText>
                </MenuItem>
            </Menu>
        )
    }

    function RequestMenu() {
        return (
            <Menu
                id='req-menu'
                open={reqMenu !== undefined}
                onClose={closeRequestMenu}
                anchorReference='anchorPosition'
                anchorPosition={{
                    top: reqMenu?.mouseY ?? 0,
                    left: reqMenu?.mouseX ?? 0
                }}
            >
                <MenuItem className='navigation-menu-item' onClick={(e) => handleAddRequest(navigationContentCtx.activeId)}>
                    <ListItemIcon>
                        <SendIcon fontSize='small' />
                    </ListItemIcon>
                    <ListItemText>Add Request</ListItemText>
                </MenuItem>
                <MenuItem className='navigation-menu-item' onClick={(e) => handleAddRequestGroup(navigationContentCtx.activeId)}>
                    <ListItemIcon>
                        <FolderIcon fontSize='small' />
                    </ListItemIcon>
                    <ListItemText>Add Request Group</ListItemText>
                </MenuItem>
                <MenuItem className='navigation-menu-item' onClick={(e) => handleDupeRequest()}>
                    <ListItemIcon>
                        <ContentCopyOutlinedIcon fontSize='small' />
                    </ListItemIcon>
                    <ListItemText>Duplicate</ListItemText>
                </MenuItem>
                <MenuItem className='navigation-menu-item' onClick={(e) => handleDeleteRequest()}>
                    <ListItemIcon>
                        <DeleteIcon fontSize='small' />
                    </ListItemIcon>
                    <ListItemText>Delete</ListItemText>
                </MenuItem>
            </Menu>
        )
    }


    function ScenarioMenu() {
        return (
            <Menu
                id='scenario-menu'
                open={scenarioMenu !== undefined}
                onClose={closeScenarioMenu}
                anchorReference='anchorPosition'
                anchorPosition={{
                    top: scenarioMenu?.mouseY ?? 0,
                    left: scenarioMenu?.mouseX ?? 0
                }}
            >
                <MenuItem onClick={(_) => handleAddScenario(navigationContentCtx.activeId)}>
                    <ListItemIcon>
                        <LanguageIcon fontSize='small' />
                    </ListItemIcon>
                    <ListItemText>Add Scenario</ListItemText>
                </MenuItem>
                <MenuItem onClick={(e) => handleDupeScenario()}>
                    <ListItemIcon>
                        <ContentCopyOutlinedIcon fontSize='small' />
                    </ListItemIcon>
                    <ListItemText>Duplicate Scenario</ListItemText>
                </MenuItem>
                <MenuItem onClick={(e) => handleDeleteScenario()}>
                    <ListItemIcon>
                        <DeleteIcon fontSize='small' />
                    </ListItemIcon>
                    <ListItemText>Delete Scenario</ListItemText>
                </MenuItem>
            </Menu>
        )
    }

    function AuthMenu() {
        return (
            <Menu
                id='auth-menu'
                open={authMenu !== undefined}
                onClose={closeAuthMenu}
                anchorReference='anchorPosition'
                anchorPosition={{
                    top: authMenu?.mouseY ?? 0,
                    left: authMenu?.mouseX ?? 0
                }}
            >
                <MenuItem onClick={(_) => handleAddAuth(navigationContentCtx.activeId)}>
                    <ListItemIcon>
                        <LockIcon fontSize='small' />
                    </ListItemIcon>
                    <ListItemText>Add Authorization</ListItemText>
                </MenuItem>
                <MenuItem onClick={(e) => handleDupeAuth()}>
                    <ListItemIcon>
                        <ContentCopyOutlinedIcon fontSize='small' />
                    </ListItemIcon>
                    <ListItemText>Duplicate Authorization</ListItemText>
                </MenuItem>
                <MenuItem onClick={(e) => handleDeleteAuth()}>
                    <ListItemIcon>
                        <DeleteIcon fontSize='small' />
                    </ListItemIcon>
                    <ListItemText>Delete Authorization</ListItemText>
                </MenuItem>
            </Menu>
        )
    }

    function CertMenu() {
        return (
            <Menu
                id='cert-menu'
                open={certMenu !== undefined}
                onClose={closeCertMenu}
                anchorReference='anchorPosition'
                anchorPosition={{
                    top: certMenu?.mouseY ?? 0,
                    left: certMenu?.mouseX ?? 0
                }}
            >
                <MenuItem onClick={(_) => handleAddCert(navigationContentCtx.activeId)}>
                    <ListItemIcon>
                        <LockIcon fontSize='small' />
                    </ListItemIcon>
                    <ListItemText>Add Certificate</ListItemText>
                </MenuItem>
                <MenuItem onClick={(e) => handleDupeCert()}>
                    <ListItemIcon>
                        <ContentCopyOutlinedIcon fontSize='small' />
                    </ListItemIcon>
                    <ListItemText>Duplicate Certificate</ListItemText>
                </MenuItem>
                <MenuItem onClick={(e) => handleDeleteCert()}>
                    <ListItemIcon>
                        <DeleteIcon fontSize='small' />
                    </ListItemIcon>
                    <ListItemText>Delete Certificate</ListItemText>
                </MenuItem>
            </Menu>
        )
    }

    function ProxyMenu() {
        return (
            <Menu
                id='proxy-menu'
                open={proxyMenu !== undefined}
                onClose={closeProxyMenu}
                anchorReference='anchorPosition'
                anchorPosition={{
                    top: proxyMenu?.mouseY ?? 0,
                    left: proxyMenu?.mouseX ?? 0
                }}
            >
                <MenuItem onClick={(_) => handleAddProxy(navigationContentCtx.activeId)}>
                    <ListItemIcon>
                        <LanguageIcon fontSize='small' />
                    </ListItemIcon>
                    <ListItemText>Add Proxy</ListItemText>
                </MenuItem>
                <MenuItem onClick={(e) => handleDupeProxy()}>
                    <ListItemIcon>
                        <ContentCopyOutlinedIcon fontSize='small' />
                    </ListItemIcon>
                    <ListItemText>Duplicate Proxy</ListItemText>
                </MenuItem>
                <MenuItem onClick={(e) => handleDeleteProxy()}>
                    <ListItemIcon>
                        <DeleteIcon fontSize='small' />
                    </ListItemIcon>
                    <ListItemText>Delete Proxy</ListItemText>
                </MenuItem>
            </Menu>
        )
    }

    const onDragCancel = (e: DragCancelEvent) => {
        setDragPosition(DragPosition.None)
    }

    const onDragMove = (e: DragMoveEvent) => {
        const { activatorEvent, delta, active, over } = e
        if (!over) return
        const pointer = activatorEvent as unknown as any
        const activeData = active.data.current as unknown as DraggableData
        const overData = over.data.current as unknown as DroppableData
        let evtDelta = delta as any

        let x = pointer.x + evtDelta.x
        let y = pointer.y + evtDelta.y

        let r = e.over?.rect

        let onLowerHalf = false
        let onLeft = false

        if (overData.isHeader) {
            onLowerHalf = true
        } else if (r) {
            if (y > r.top + (r.height / 2)) onLowerHalf = true
            if (x < 72 + overData.depth * 16) onLeft = true
        }

        let position
        if (active.id === over.id) {
            position = DragPosition.None
        } else if (activeData.type === overData.acceptsType) {
            if (onLeft) {
                position = DragPosition.Left
            } else if (onLowerHalf) {
                position = DragPosition.Lower
            } else {
                position = DragPosition.Upper
            }
        } else {
            position = DragPosition.Invalid
        }
        setDragPosition(position)
    }

    const onDragEnd = (e: DragEndEvent) => {
        const { activatorEvent, delta, active, over } = e
        if (!over) return
        const pointer = activatorEvent as unknown as any
        const activeData = active.data.current as unknown as DraggableData
        const overData = over.data.current as unknown as DroppableData

        let evtDelta = delta as any

        let x = pointer.x + evtDelta.x
        let y = pointer.y + evtDelta.y

        let r = e.over?.rect

        let onLowerHalf = false
        let onLeft = false

        if (r) {
            if (y > r.top + (r.height / 2)) onLowerHalf = true
            if (x < 72 + overData.depth * 16) onLeft = true
        }

        if (activeData.type === overData.acceptsType) {
            activeData.move(overData.isHeader ? null : over.id.toString(), onLowerHalf, onLeft)
        }
        setDragPosition(DragPosition.None)
    }

    const defaultExpanded = ['hdr-request', 'hdr-scenario', 'hdr-auth', 'hdr-cert', 'hdr-proxy']
    const expandRequestsWithChildren = (item: NavigationListItem) => {
        if (item.children && (item.children?.length ?? 0) > 0) {
            defaultExpanded.push(item.id)
            item.children.forEach(expandRequestsWithChildren)
        }
    }
    navigationContentCtx.requestList.forEach(expandRequestsWithChildren)

    return (
        <Stack direction='column' className='selection-pane' sx={{ flexShrink: 0, bottom: 0, overflow: 'auto', marginRight: '4px', paddingRight: '20px', backgroundColor: '#202020' }}>
            <Box display='flex' flexDirection='row' sx={{ marginBottom: '24px', paddingLeft: '4px', paddingRight: '2px' }}>
                <Box sx={{ width: '100%', marginRight: '8px' }}>
                    <IconButton aria-label='new' title='New Workbook (Ctrl + N)' onClick={() => props.triggerNew()}>
                        <PostAddIcon />
                    </IconButton>
                    <IconButton aria-label='open' title='Open Workbook (Ctrl + O)' onClick={() => props.triggerOpen()} sx={{ marginLeft: '4px' }}>
                        <FileOpenIcon />
                    </IconButton>
                    <IconButton aria-label='save' title='Save Workbook (Ctrl + S)' disabled={windowCtx.workbookFullName.length == 0} onClick={() => props.triggerSave()} sx={{ marginLeft: '4px' }}>
                        <SaveIcon />
                    </IconButton>
                    <IconButton aria-label='save' title='Save Workbook As (Ctrl + Shift + S)' onClick={() => props.triggerSaveAs()} sx={{ marginLeft: '4px' }}>
                        <SaveAsIcon />
                    </IconButton>
                    <IconButton aria-label='help' title='Help' sx={{ float: 'right' }} onClick={() => { showHelp(); }}>
                        <HelpIcon />
                    </IconButton>
                </Box>
            </Box>
            <DndContext onDragMove={onDragMove} onDragCancel={onDragCancel} onDragEnd={onDragEnd} sensors={sensors}>
                <TreeView
                    disableSelection
                    id='navigation'
                    key='navigation'
                    aria-label='request navigator'
                    defaultCollapseIcon={<ExpandMoreIcon />}
                    defaultExpandIcon={<ChevronRightIcon />}
                    defaultExpanded={defaultExpanded}
                    selected={navigationContentCtx.activeId}
                    multiSelect={false}
                    sx={{ height: '100vh', flexGrow: 1, maxWidth: 400, overflowY: 'auto' }}
                >
                    <NavTreeSection key='nav-section-request' type='request' title='Requests' helpTopic='requests' onAdd={() => { }}>
                        {
                            navigationContentCtx.requestList.map(t => <NavTreeItem
                                item={t}
                                depth={0}
                                type='request'
                                key={`nav-section-${t.id}`}
                                onSelect={selectRequest}
                                onMenu={handleShowRequestMenu}
                                onMove={handleMoveRequest}
                            />)
                        }
                    </NavTreeSection>
                    <NavTreeSection key='nav-section-scenario' type='scenario' title='Scenarios' helpTopic='scenarios' onAdd={handleAddScenario}>
                        {
                            navigationContentCtx.scenarioList.map(t => <NavTreeItem
                                item={t}
                                depth={0}
                                type='scenario'
                                key={`nav-section-${t.id}`}
                                onSelect={selectScenario}
                                onMenu={handleShowScenarioMenu}
                                onMove={handleMoveScenario}
                            />)
                        }
                    </NavTreeSection>
                    <NavTreeSection key='nav-section-auth' type='auth' title='Authorizations' helpTopic='authorizations' onAdd={handleAddAuth}>
                        {
                            navigationContentCtx.authorizationList.map(t => <NavTreeItem
                                item={t}
                                depth={0}
                                type='auth'
                                key={`nav-section-${t.id}`}
                                onSelect={selectAuthorization}
                                onMenu={handleShowAuthMenu}
                                onMove={handleMoveAuth}
                            />)
                        }
                    </NavTreeSection>
                    <NavTreeSection key='nav-section-cert' type='cert' title='Certificates' helpTopic='certificates' onAdd={handleAddCert}>
                        {
                            navigationContentCtx.certificateList.map(t => <NavTreeItem
                                item={t}
                                depth={0}
                                type='cert'
                                key={`nav-section-${t.id}`}
                                onSelect={selectCertificate}
                                onMenu={handleShowCertMenu}
                                onMove={handleMoveCert}
                            />)
                        }
                    </NavTreeSection>
                    <NavTreeSection key='nav-section-proxy' type='proxy' title='Proxies' helpTopic='proxies' onAdd={handleAddProxy}>
                        {
                            navigationContentCtx.proxyList.map(t => <NavTreeItem
                                item={t}
                                depth={0}
                                type='proxy'
                                key={`nav-proxy-${t.id}`}
                                onSelect={selectProxy}
                                onMenu={handleShowProxyMenu}
                                onMove={handleMoveProxy}
                            />)
                        }
                    </NavTreeSection>
                </TreeView>
            </DndContext>
            <RequestsMenu />
            <RequestMenu />
            <ScenarioMenu />
            <AuthMenu />
            <CertMenu />
            <ProxyMenu />
        </Stack>
    )
}
