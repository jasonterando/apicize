import MoreVertIcon from '@mui/icons-material/MoreVert';
import FolderIcon from '@mui/icons-material/Folder'
import FileOpenIcon from '@mui/icons-material/FileOpen'
import PostAddIcon from '@mui/icons-material/PostAdd'
import SaveIcon from '@mui/icons-material/Save'
import SaveAsIcon from '@mui/icons-material/SaveAs'
import SendIcon from '@mui/icons-material/Send'
import LockIcon from '@mui/icons-material/Lock'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlined'
import LanguageIcon from '@mui/icons-material/Language'
import { TreeView } from '@mui/x-tree-view/TreeView'
import { TreeItem } from '@mui/x-tree-view/TreeItem'
import { Box, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Stack, alpha } from '@mui/material'
import {WorkbookState} from '../../models/store'
import { useSelector } from 'react-redux'
import AddIcon from '@mui/icons-material/Add'
import React, { MouseEvent, PointerEvent, ReactNode, SyntheticEvent, useContext, useState } from 'react'
import { useConfirmation } from '../../services/confirmation-service'
import { DndContext, DragEndEvent, useDraggable, useDroppable, useSensors, useSensor, PointerSensor } from '@dnd-kit/core'
import { GetTitle } from '@apicize/lib-typescript';
import { CSS, useCombinedRefs } from '@dnd-kit/utilities';
import { WorkbookStorageContext } from '../../contexts/workbook-storage-context';
import { NavigationListItem } from '../../models/navigation-list-item';

interface MenuPosition {
    id: string
    mouseX: number
    mouseY: number
}

export function Navigation(props: {
    triggerNew: () => void,
    triggerOpen: () => void,
    triggerSave: () => void,
    triggerSaveAs: () => void,
}) {

    const context = useContext(WorkbookStorageContext)
    const confirm = useConfirmation()

    let activeRequestID = useSelector((state: WorkbookState) => state.request.id)
    let activeGroupID = useSelector((state: WorkbookState) => state.group.id)
    let activeAuthorizationID = useSelector((state: WorkbookState) => state.authorization.id)
    let activeScenarioID = useSelector((state: WorkbookState) => state.scenario.id)

    const requests = useSelector((state: WorkbookState) => state.navigation.requestList)
    const authorizations = useSelector((state: WorkbookState) => state.navigation.authorizationList)
    const scenarios = useSelector((state: WorkbookState) => state.navigation.scenarioList)
    const workbookFullName = useSelector((state: WorkbookState) => state.workbook.workbookFullName)
    const [selected, setSelected] = React.useState<string>('')

    const [requestsMenu, setRequestsMenu] = useState<MenuPosition | undefined>(undefined)
    const [reqMenu, setReqMenu] = useState<MenuPosition | undefined>(undefined)
    const [authMenu, setAuthMenu] = useState<MenuPosition | undefined>(undefined)
    const [scenarioMenu, setScenarioMenu] = useState<MenuPosition | undefined>(undefined)

    const activeRequestEntityID = activeRequestID ?? activeGroupID
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

    React.useEffect(() => {
        if (activeRequestID) {
            selectRequest(activeRequestID)
        }
    }, [activeRequestID])

    React.useEffect(() => {
        if (activeGroupID) {
            selectRequest(activeGroupID)
        }
    }, [activeGroupID])

    React.useEffect(() => {
        if (activeAuthorizationID) {
            selectAuthorization(activeAuthorizationID)
        }
    }, [activeAuthorizationID])

    React.useEffect(() => {
        if (activeScenarioID) {
            selectScenario(activeScenarioID)
        }
    }, [activeScenarioID])


    function NavTreeSection(props: {
        children?: ReactNode | undefined
        type: string
        title: string
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
            onClick={e => handleSelectHeader(e)}
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
                        handleSelectHeader(e)
                    }}
                    sx={{ backgroundColor: isOver ? alpha('#0F0', 0.20) : 'default' }}
                >
                    {
                        props.type === 'request' ? (<SendIcon sx={{ flexGrow: 0, marginRight: '10px' }} />) :
                            props.type === 'auth' ? (<LockIcon sx={{ flexGrow: 0, marginRight: '10px' }} />) :
                                props.type === 'scenario' ? (<LanguageIcon sx={{ flexGrow: 0, marginRight: '10px' }} />) :
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
                    key={props.item.id}
                    id={props.item.id}
                    ref={useCombinedRefs(setDragRef, setDropRef)}
                    style={dragStyle}
                    {...listeners}
                    {...attributes}
                    onClick={(e) => {
                        // Prevent label from expanding/collapsing
                        e.preventDefault()
                        e.stopPropagation()
                        if (props.onSelect) props.onSelect(props.item.id)
                    }}
                    onFocusCapture={e => e.stopPropagation()}
                    sx={{ backgroundColor: isOver ? alpha('#0F0', 0.20) : 'default' }}
                    label={(
                        <Box
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
                                    visibility: props.item.id === selected ? 'normal' : 'hidden'
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
                            depth={props.depth+1}
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
                sx={{ backgroundColor: isOver ? 'green' : 'default' }}
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
                        <Box className='nav-node-text'>{GetTitle(props.item)}</Box>
                        <IconButton
                            sx={{
                                visibility: props.item.id === selected ? 'normal' : 'hidden'
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
        context.workbook.clearAllActivations()
        setSelected('')
    }


    const closeRequestsMenu = () => {
        setRequestsMenu(undefined)
    }

    const closeRequestMenu = () => {
        setReqMenu(undefined)
    }

    const closeAuthMenu = () => {
        setAuthMenu(undefined)
    }

    const closeScenarioMenu = () => {
        setScenarioMenu(undefined)
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

    const handleSelectHeader = (e: SyntheticEvent) => {
        e.preventDefault()
        e.stopPropagation()
        clearAllSelections()
        closeRequestsMenu()
        closeRequestMenu()
        closeAuthMenu()
        closeScenarioMenu()
    }

    const selectRequest = (id: string) => {
        context.workbook.activateRequestOrGroup(id)
        setSelected(id)
    }

    const selectAuthorization = (id: string) => {
        context.workbook.activateAuthorization(id)
        setSelected(id)
    }

    const selectScenario = (id: string) => {
        context.workbook.activateScenario(id)
        setSelected(id)
    }

    const handleAddRequest = (targetRequestId?: string | null) => {
        closeRequestsMenu()
        closeRequestMenu()
        context.request.add(targetRequestId)
    }

    const handleAddRequestGroup = (targetRequestId?: string | null) => {
        closeRequestsMenu()
        closeRequestMenu()
        context.group.add(targetRequestId)
    }

    const handleAddAuth = (targetAuthId?: string | null) => {
        closeAuthMenu()
        context.authorization.add(targetAuthId)
    }

    const handleAddScenario = (targetScenarioId?: string | null) => {
        closeScenarioMenu()
        context.scenario.add(targetScenarioId)
    }

    const handleDeleteRequest = () => {
        closeRequestMenu()
        closeRequestsMenu()
        if (! activeRequestEntityID) return
        confirm({
            title: 'Delete Request',
            message: `Are you are you sure you want to delete ${GetTitle(requests.find(r => r.id === activeRequestEntityID))}?`,
            okButton: 'Yes',
            cancelButton: 'No',
            defaultToCancel: true
        }).then((result) => {
            if (result) {
                clearAllSelections()
                context.request.delete(activeRequestEntityID)
            }
        })
    }

    const handleDeleteAuth = () => {
        closeAuthMenu()
        const id = activeAuthorizationID
        if (!id) return
        confirm({
            title: 'Delete Authorization',
            message: `Are you are you sure you want to delete ${GetTitle(authorizations.find(a => a.id === id))}?`,
            okButton: 'Yes',
            cancelButton: 'No',
            defaultToCancel: true
        }).then((result) => {
            if (result) {
                clearAllSelections()
                context.authorization.delete(id)
            }
        })
    }

    const handleDeleteScenario = () => {
        closeScenarioMenu()
        const id = activeScenarioID
        if (!id) return

        confirm({
            title: 'Delete Scenario',
            message: `Are you are you sure you want to delete ${GetTitle(scenarios.find(s => s.id === id))}?`,
            okButton: 'Yes',
            cancelButton: 'No',
            defaultToCancel: true
        }).then((result) => {
            if (result) {
                clearAllSelections()
                context.scenario.delete(id)
            }
        })
    }

    const handleDupeRequest = () => {
        closeRequestMenu()
        closeRequestsMenu()
        if (activeRequestEntityID) context.request.copy(activeRequestEntityID)
    }

    const handleDupeAuth = () => {
        closeAuthMenu()
        if (activeAuthorizationID) context.authorization.copy(activeAuthorizationID)
    }

    const handleDupeScenario = () => {
        closeScenarioMenu()
        if (activeScenarioID) context.scenario.copy(activeScenarioID)
    }

    const handleMoveRequest = (id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) => {
        selectRequest(id)
        context.request.move(id, destinationID, onLowerHalf, onLeft)
    }

    const handleMoveAuth = (id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) => {
        selectAuthorization(id)
        context.authorization.move(id, destinationID, onLowerHalf, onLeft)
    }

    const handleMoveScenario = (id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) => {
        selectScenario(id)
        context.scenario.move(id, destinationID, onLowerHalf, onLeft)
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
                <MenuItem onClick={(_) => handleAddRequest(activeRequestEntityID)}>
                    <ListItemIcon>
                        <SendIcon fontSize='small' />
                    </ListItemIcon>
                    <ListItemText>Add Request</ListItemText>
                </MenuItem>
                <MenuItem onClick={(_) => handleAddRequestGroup(activeRequestEntityID)}>
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
                <MenuItem onClick={(e) => handleAddRequest(activeRequestEntityID)}>
                    <ListItemIcon>
                        <SendIcon fontSize='small' />
                    </ListItemIcon>
                    <ListItemText>Add Request</ListItemText>
                </MenuItem>
                <MenuItem onClick={(e) => handleAddRequestGroup(activeRequestEntityID)}>
                    <ListItemIcon>
                        <FolderIcon fontSize='small' />
                    </ListItemIcon>
                    <ListItemText>Add Request Group</ListItemText>
                </MenuItem>
                <MenuItem onClick={(e) => handleDupeRequest()}>
                    <ListItemIcon>
                        <ContentCopyOutlinedIcon fontSize='small' />
                    </ListItemIcon>
                    <ListItemText>Duplicate</ListItemText>
                </MenuItem>
                <MenuItem onClick={(e) => handleDeleteRequest()}>
                    <ListItemIcon>
                        <DeleteIcon fontSize='small' />
                    </ListItemIcon>
                    <ListItemText>Delete</ListItemText>
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
                <MenuItem onClick={(_) => handleAddAuth(activeAuthorizationID)}>
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
                <MenuItem onClick={(_) => handleAddScenario(activeScenarioID)}>
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
        
        console.log('onDragEnd', e)
        if (activeData.type === overData.acceptsType) {
            activeData.move(overData.isHeader ? null : over.id.toString(), onLowerHalf, onLeft)
        }
    }

    const defaultExpanded = ['hdr-request', 'hdr-auth', 'hdr-scenario']
    const expandRequestsWithChildren = (item: NavigationListItem) => {
        if (item.children && (item.children?.length ?? 0) > 0) {
            defaultExpanded.push(item.id)
            item.children.forEach(expandRequestsWithChildren)
        }
    }
    requests.forEach(expandRequestsWithChildren)
    // console.log('Default expanded: ' + defaultExpanded.join(', '))

    return (
        <Stack direction='column' className='selection-pane' sx={{ flexShrink: 0, bottom: 0, overflow: 'auto', marginRight: '8px', paddingRight: '40px', backgroundColor: '#202020' }}>
            <Box sx={{ marginBottom: '24px', paddingLeft: '4px', paddingRight: '4px' }}>
                <IconButton aria-label='new' title='New Workbook (Ctrl + N)' onClick={() => props.triggerNew()}>
                    <PostAddIcon />
                </IconButton>
                <IconButton aria-label='open' title='Open Workbook (Ctrl + O)' onClick={() => props.triggerOpen()} sx={{ marginLeft: '4px' }}>
                    <FileOpenIcon />
                </IconButton>
                <IconButton aria-label='save' title='Save Workbook (Ctrl + S)' disabled={(workbookFullName?.length ?? 0) == 0} onClick={() => props.triggerSave()} sx={{ marginLeft: '4px' }}>
                    <SaveIcon />
                </IconButton>
                <IconButton aria-label='save' title='Save Workbook As (Ctrl + Shift + S)' onClick={() => props.triggerSaveAs()} sx={{ marginLeft: '4px' }}>
                    <SaveAsIcon />
                </IconButton>
            </Box>
            <DndContext onDragEnd={onDragEnd} sensors={sensors}>
                <TreeView
                    disableSelection
                    id='navigation'
                    key='navigation'
                    aria-label='request navigator'
                    defaultCollapseIcon={<ExpandMoreIcon />}
                    defaultExpandIcon={<ChevronRightIcon />}
                    defaultExpanded={defaultExpanded}
                    selected={selected}
                    multiSelect={false}
                    sx={{ height: '100vh', flexGrow: 1, maxWidth: 400, overflowY: 'auto' }}
                >
                    <NavTreeSection key='nav-section-request' type='request' title='Requests' onAdd={() => { }}>
                        {
                            requests.map(t => <NavTreeItem
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
                    <NavTreeSection key='nav-section-auth' type='auth' title='Authorizations' onAdd={handleAddAuth}>
                        {
                            authorizations.map(t => <NavTreeItem
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
                    <NavTreeSection key='nav-section-scenario' type='scenario' title='Scenarios' onAdd={handleAddScenario}>
                        {
                            scenarios.map(t => <NavTreeItem
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
                </TreeView>
            </DndContext>
            <RequestsMenu />
            <RequestMenu />
            <AuthMenu />
            <ScenarioMenu />
        </Stack>
    )
}
