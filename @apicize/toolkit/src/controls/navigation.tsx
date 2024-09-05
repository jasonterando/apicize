import { observer } from "mobx-react-lite"
import { useWindow, useWorkspace } from "../contexts/root.context"
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FolderIcon from '@mui/icons-material/Folder'
import FileOpenIcon from '@mui/icons-material/FileOpen'
import PostAddIcon from '@mui/icons-material/PostAdd'
import SaveIcon from '@mui/icons-material/Save'
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
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
import AddIcon from '@mui/icons-material/Add'
import React, { ReactNode, SyntheticEvent, useContext, useState } from 'react'
import { useConfirmation } from '../services/confirmation-service'
import { DndContext, DragEndEvent, useDraggable, useDroppable, useSensors, useSensor, PointerSensor, DragCancelEvent, DragMoveEvent } from '@dnd-kit/core'
import { GetTitle } from '@apicize/lib-typescript';
import { CSS, useCombinedRefs } from '@dnd-kit/utilities';
import { EditableItem } from "../models/editable";
import { EditableEntityType } from "../models/workbook/editable-entity-type";

interface MenuPosition {
    id: string
    mouseX: number
    mouseY: number
}


export const Navigation = observer((props: {
    triggerNew: () => void,
    triggerOpen: () => void,
    triggerSave: () => void,
    triggerSaveAs: () => void,
}) => {

    const workspaceCtx = useWorkspace()
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

    const NavTreeItem = observer((props: {
        type: string,
        item: EditableItem,
        depth: number,
        onSelect?: (id: string) => void,
        onMenu?: (event: React.MouseEvent, id: string) => void,
        onMove?: (id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) => void
    }) => {
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

        // Requests can be hierarchical
        let children: EditableItem[] | undefined
        if (props.item.entityType === EditableEntityType.Request) {
            const childIds = workspaceCtx.workspace.requests.childIds?.get(props.item.id)
            children = childIds?.map(id => 
                workspaceCtx.workspace.requests.entities.get(id)
            )?.filter(e => e !== undefined)
        }

        return children && children.length > 0
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
                            <Box className='nav-node-text'>{GetTitle(props.item)}</Box>
                            <IconButton
                                sx={{
                                    visibility: props.item.id === workspaceCtx.active?.id ? 'normal' : 'hidden'
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
                    {children.map(c => (
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
                            Array.isArray(children)
                                ? <FolderIcon sx={{ flexGrow: 0, marginRight: '10px' }} />
                                : null
                        }
                        <Box 
                            className='nav-node-text' 
                            sx={{  display: 'flex', alignItems: 'center' }}
                        >
                            {
                                props.item.invalid ? (<WarningAmberIcon sx={{color: '#FFFF00', marginRight: '0.25em'}}  />) : null
                            }
                            {
                                GetTitle(props.item)
                            }
                        </Box>
                        <IconButton
                            sx={{
                                visibility: props.item.id === workspaceCtx.active?.id ? 'normal' : 'hidden'
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
    })

    const clearAllSelections = () => {
        workspaceCtx.clearActive()
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
            workspaceCtx.showHelp(helpTopic)
        }
    }

    const showHelp = () => {
        closeAllMenus()
        workspaceCtx.showNextHelpTopic()

    }

    const selectRequest = (id: string) => {
        workspaceCtx.changeActive(EditableEntityType.Request, id)
    }

    const selectScenario = (id: string) => {
        workspaceCtx.changeActive(EditableEntityType.Scenario, id)
    }

    const selectAuthorization = (id: string) => {
        workspaceCtx.changeActive(EditableEntityType.Authorization, id)
    }

    const selectCertificate = (id: string) => {
        workspaceCtx.changeActive(EditableEntityType.Certificate, id)
    }

    const selectProxy = (id: string) => {
        workspaceCtx.changeActive(EditableEntityType.Proxy, id)
    }

    const handleAddRequest = (targetRequestId?: string | null) => {
        closeRequestsMenu()
        closeRequestMenu()
        workspaceCtx.addRequest(targetRequestId)
    }

    const handleAddRequestGroup = (targetRequestId?: string | null) => {
        closeRequestsMenu()
        closeRequestMenu()
        workspaceCtx.addGroup(targetRequestId)
    }

    const handleAddScenario = (targetScenarioId?: string | null) => {
        closeScenarioMenu()
        workspaceCtx.addScenario(targetScenarioId)
    }

    const handleAddAuth = (targetAuthId?: string | null) => {
        closeAuthMenu()
        workspaceCtx.addAuthorization(targetAuthId)
    }
    const handleAddCert = (targetCertId?: string | null) => {
        closeCertMenu()
        workspaceCtx.addCertificate(targetCertId)
    }

    const handleAddProxy = (targetProxyId?: string | null) => {
        closeProxyMenu()
        workspaceCtx.addProxy(targetProxyId)
    }

    const handleDeleteRequest = () => {
        closeRequestMenu()
        closeRequestsMenu()
        if (!workspaceCtx.active?.id || (workspaceCtx.active?.entityType !== EditableEntityType.Request)) return
        const id = workspaceCtx.active?.id
        confirm({
            title: 'Delete Request',
            message: `Are you are you sure you want to delete ${GetTitle(workspaceCtx.workspace.requests.entities.get(id))}?`,
            okButton: 'Yes',
            cancelButton: 'No',
            defaultToCancel: true
        }).then((result) => {
            if (result) {
                clearAllSelections()
                workspaceCtx.deleteRequest(id)
            }
        })
    }

    const handleDeleteScenario = () => {
        closeScenarioMenu()
        if (!workspaceCtx.active?.id || workspaceCtx.active?.entityType !== EditableEntityType.Scenario) return
        const id = workspaceCtx.active?.id
        confirm({
            title: 'Delete Scenario',
            message: `Are you are you sure you want to delete ${GetTitle(workspaceCtx.workspace.scenarios.entities.get(id))}?`,
            okButton: 'Yes',
            cancelButton: 'No',
            defaultToCancel: true
        }).then((result) => {
            if (result) {
                clearAllSelections()
                workspaceCtx.deleteScenario(id)
            }
        })
    }

    const handleDeleteAuth = () => {
        closeAuthMenu()
        if (!workspaceCtx.active?.id || workspaceCtx.active?.entityType !== EditableEntityType.Authorization) return
        const id = workspaceCtx.active?.id
        confirm({
            title: 'Delete Authorization',
            message: `Are you are you sure you want to delete ${GetTitle(workspaceCtx.workspace.authorizations.entities.get(id))}?`,
            okButton: 'Yes',
            cancelButton: 'No',
            defaultToCancel: true
        }).then((result) => {
            if (result) {
                clearAllSelections()
                workspaceCtx.deleteAuthorization(id)
            }
        })
    }

    const handleDeleteCert = () => {
        closeCertMenu()
        if (!workspaceCtx.active?.id || workspaceCtx.active?.entityType !== EditableEntityType.Certificate) return
        const id = workspaceCtx.active?.id
        confirm({
            title: 'Delete Certificate',
            message: `Are you are you sure you want to delete ${GetTitle(workspaceCtx.workspace.certificates.entities.get(id))}?`,
            okButton: 'Yes',
            cancelButton: 'No',
            defaultToCancel: true
        }).then((result) => {
            if (result) {
                clearAllSelections()
                workspaceCtx.deleteCertificate(id)
            }
        })
    }
    const handleDeleteProxy = () => {
        closeProxyMenu()
        if (!workspaceCtx.active?.id || workspaceCtx.active?.entityType !== EditableEntityType.Proxy) return
        const id = workspaceCtx.active?.id
        confirm({
            title: 'Delete Proxy',
            message: `Are you are you sure you want to delete ${GetTitle(workspaceCtx.workspace.requests.entities.get(id))}?`,
            okButton: 'Yes',
            cancelButton: 'No',
            defaultToCancel: true
        }).then((result) => {
            if (result) {
                clearAllSelections()
                workspaceCtx.deleteProxy(id)
            }
        })
    }

    const handleDupeRequest = () => {
        closeRequestMenu()
        closeRequestsMenu()
        if (workspaceCtx.active?.entityType === EditableEntityType.Request && workspaceCtx.active?.id) workspaceCtx.copyRequest(workspaceCtx.active?.id)
    }

    const handleDupeScenario = () => {
        closeScenarioMenu()
        if (workspaceCtx.active?.entityType === EditableEntityType.Scenario && workspaceCtx.active?.id) workspaceCtx.copyScenario(workspaceCtx.active?.id)
    }

    const handleDupeAuth = () => {
        closeAuthMenu()
        if (workspaceCtx.active?.entityType === EditableEntityType.Authorization && workspaceCtx.active?.id) workspaceCtx.copyAuthorization(workspaceCtx.active?.id)
    }

    const handleDupeCert = () => {
        closeCertMenu()
        if (workspaceCtx.active?.entityType === EditableEntityType.Certificate && workspaceCtx.active?.id) workspaceCtx.copyCertificate(workspaceCtx.active?.id)
    }

    const handleDupeProxy = () => {
        closeProxyMenu()
        if (workspaceCtx.active?.entityType === EditableEntityType.Proxy && workspaceCtx.active?.id) workspaceCtx.copyProxy(workspaceCtx.active?.id)
    }

    const handleMoveRequest = (id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) => {
        selectRequest(id)
        workspaceCtx.moveRequest(id, destinationID, onLowerHalf, onLeft)
    }

    const handleMoveScenario = (id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) => {
        selectScenario(id)
        workspaceCtx.moveScenario(id, destinationID, onLowerHalf, onLeft)
    }

    const handleMoveAuth = (id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) => {
        selectAuthorization(id)
        workspaceCtx.moveAuthorization(id, destinationID, onLowerHalf, onLeft)
    }

    const handleMoveCert = (id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) => {
        selectCertificate(id)
        workspaceCtx.moveCertificate(id, destinationID, onLowerHalf, onLeft)
    }

    const handleMoveProxy = (id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) => {
        selectProxy(id)
        workspaceCtx.moveProxy(id, destinationID, onLowerHalf, onLeft)
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
                <MenuItem className='navigation-menu-item' onClick={(_) => handleAddRequest(workspaceCtx.active?.id)}>
                    <ListItemIcon>
                        <SendIcon fontSize='small' />
                    </ListItemIcon>
                    <ListItemText>Add Request</ListItemText>
                </MenuItem>
                <MenuItem className='navigation-menu-item' onClick={(_) => handleAddRequestGroup(workspaceCtx.active?.id)}>
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
                <MenuItem className='navigation-menu-item' onClick={(e) => handleAddRequest(workspaceCtx.active?.id)}>
                    <ListItemIcon>
                        <SendIcon fontSize='small' />
                    </ListItemIcon>
                    <ListItemText>Add Request</ListItemText>
                </MenuItem>
                <MenuItem className='navigation-menu-item' onClick={(e) => handleAddRequestGroup(workspaceCtx.active?.id)}>
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
                <MenuItem onClick={(_) => handleAddScenario(workspaceCtx.active?.id)}>
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
                <MenuItem onClick={(_) => handleAddAuth(workspaceCtx.active?.id)}>
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
                <MenuItem onClick={(_) => handleAddCert(workspaceCtx.active?.id)}>
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
                <MenuItem onClick={(_) => handleAddProxy(workspaceCtx.active?.id)}>
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
    const expandRequestsWithChildren = (item: EditableItem) => {
        if (item.entityType === EditableEntityType.Request)  {
            const childIDs = workspaceCtx.workspace.requests.childIds?.get(item.id)
            if (childIDs && childIDs.length > 0) {
                defaultExpanded.push(item.id)
                childIDs
                    .map(id => workspaceCtx.workspace.requests.entities.get(id))
                    .filter(e => e !== undefined)
                    .forEach(expandRequestsWithChildren)
            }
        }
    }
    workspaceCtx.workspace.requests.entities.forEach(expandRequestsWithChildren)

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
                    selected={workspaceCtx.active?.id ?? ''}
                    multiSelect={false}
                    sx={{ height: '100vh', flexGrow: 1, maxWidth: 400, overflowY: 'auto' }}
                >
                    <NavTreeSection key='nav-section-request' type='request' title='Requests' helpTopic='requests' onAdd={() => { }}>
                        {
                            // xxx
                            workspaceCtx.workspace.requests.topLevelIds.map((id) =>
                                workspaceCtx.workspace.requests.entities.get(id)
                            )   
                                .filter(e => e !== undefined)
                                .map(e => (
                                    <NavTreeItem
                                        item={e}
                                        depth={0}
                                        type='request'
                                        key={`nav-section-${e.id}`}
                                        onSelect={selectRequest}
                                        onMenu={handleShowRequestMenu}
                                        onMove={handleMoveRequest}
                                    />)
                                )
                        }
                    </NavTreeSection>
                    <NavTreeSection key='nav-section-scenario' type='scenario' title='Scenarios' helpTopic='scenarios' onAdd={handleAddScenario}>
                        {
                            workspaceCtx.workspace.scenarios.topLevelIds.map((id) =>
                                workspaceCtx.workspace.scenarios.entities.get(id)
                            )
                                .filter(e => e !== undefined)
                                .map(e => (
                                    <NavTreeItem
                                        item={e}
                                        depth={0}
                                        type='scenario'
                                        key={`nav-section-${e.id}`}
                                        onSelect={selectScenario}
                                        onMenu={handleShowScenarioMenu}
                                        onMove={handleMoveScenario}
                                    />)
                                )
                        }
                    </NavTreeSection>
                    <NavTreeSection key='nav-section-auth' type='auth' title='Authorizations' helpTopic='authorizations' onAdd={handleAddAuth}>
                        {
                            workspaceCtx.workspace.authorizations.topLevelIds.map((id) =>
                                workspaceCtx.workspace.authorizations.entities.get(id)
                            )
                                .filter(e => e !== undefined)
                                .map(e => (
                                    <NavTreeItem
                                        item={e}
                                        depth={0}
                                        type='auth'
                                        key={`nav-section-${e.id}`}
                                        onSelect={selectAuthorization}
                                        onMenu={handleShowAuthMenu}
                                        onMove={handleMoveAuth}
                                    />)
                                )
                        }
                    </NavTreeSection>
                    <NavTreeSection key='nav-section-cert' type='cert' title='Certificates' helpTopic='certificates' onAdd={handleAddCert}>
                        {
                            workspaceCtx.workspace.certificates.topLevelIds.map((id) =>
                                workspaceCtx.workspace.certificates.entities.get(id)
                            )
                                .filter(e => e !== undefined)
                                .map(e => (
                                    <NavTreeItem
                                        item={e}
                                        depth={0}
                                        type='cert'
                                        key={`nav-section-${e.id}`}
                                        onSelect={selectCertificate}
                                        onMenu={handleShowCertMenu}
                                        onMove={handleMoveCert}
                                    />)
                                )
                        }
                    </NavTreeSection>
                    <NavTreeSection key='nav-section-proxy' type='proxy' title='Proxies' helpTopic='proxies' onAdd={handleAddProxy}>
                        {
                            workspaceCtx.workspace.proxies.topLevelIds.map((id) =>
                                workspaceCtx.workspace.proxies.entities.get(id)
                            )
                                .filter(e => e !== undefined)
                                .map(e => (
                                    <NavTreeItem
                                        item={e}
                                        depth={0}
                                        type='proxy'
                                        key={`nav-section-${e.id}`}
                                        onSelect={selectProxy}
                                        onMenu={handleShowProxyMenu}
                                        onMove={handleMoveProxy}
                                    />)
                                )
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
})
