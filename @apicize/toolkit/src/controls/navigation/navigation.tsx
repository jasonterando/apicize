import MoreVertIcon from '@mui/icons-material/MoreVert';
import FolderIcon from '@mui/icons-material/Folder'
import SendIcon from '@mui/icons-material/Send'
import LockIcon from '@mui/icons-material/Lock'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import DeleteIcon from '@mui/icons-material/DeleteOutlined'
import LanguageIcon from '@mui/icons-material/Language'
import { TreeView } from '@mui/x-tree-view/TreeView'
import { TreeItem } from '@mui/x-tree-view/TreeItem'
import { Box, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Stack } from '@mui/material'
import {
    NavigationListItem,
    RootState, addNewAuthorization, addNewEnvironment, addNewRequest, addNewRequestGroup, deleteAuthorization, deleteEnvironment, deleteRequest,
    moveAuthorization,
    moveEnvironment,
    moveRequest,
    setActiveAuthorization, setActiveEnvironment, setActiveRequest, setNavigationMenu
} from '../../models/store'
import { useDispatch, useSelector } from 'react-redux'
import AddIcon from '@mui/icons-material/Add'
import React, { ReactNode, SyntheticEvent, DragEvent } from 'react'
import { useConfirmation } from '../../services/confirmation-service'
import { DndContext, DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core'
import './navigation.css'
import { GetEditableTitle } from '@apicize/definitions/dist/models/identifiable';
import { CSS, useCombinedRefs } from '@dnd-kit/utilities';

export function Navigation() {

    const dispatch = useDispatch()
    const confirm = useConfirmation()

    const requests = useSelector((state: RootState) => state.requestList)
    const authorizations = useSelector((state: RootState) => state.authorizationList)
    const environments = useSelector((state: RootState) => state.environmentList)
    const activeRequest = useSelector((state: RootState) => state.activeRequest)
    const activeRequestGroup = useSelector((state: RootState) => state.activeRequestGroup)
    const activeAuth = useSelector((state: RootState) => state.activeAuthorization)
    const activeEnv = useSelector((state: RootState) => state.activeEnvironment)
    const navigationMenu = useSelector((state: RootState) => state.navigationMenu)
    const [selected, setSelected] = React.useState<string>('')

    interface DraggableData {
        type: string,
        move: (destinationID: string | null) => void
    }

    interface DroppableData {
        isHeader: boolean
        acceptsType: string
    }

    React.useEffect(() => {
        if (activeRequest) {
            selectRequest(activeRequest.id)
        }
    }, [activeRequest])

    React.useEffect(() => {
        if (activeRequestGroup) {
            selectRequest(activeRequestGroup.id)
        }
    }, [activeRequestGroup])

    React.useEffect(() => {
        if (activeAuth) {
            selectAuthorization(activeAuth.id)
        }
    }, [activeAuth])

    React.useEffect(() => {
        if (activeEnv) {
            selectEnvironment(activeEnv?.id)
        }
    }, [activeEnv])


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
                    sx={{ backgroundColor: isOver ? 'green' : 'default' }}
                    >
                    {
                        props.type === 'request' ? (<SendIcon sx={{ flexGrow: 0, marginRight: '10px' }} />) :
                            props.type === 'auth' ? (<LockIcon sx={{ flexGrow: 0, marginRight: '10px' }} />) :
                                props.type === 'env' ? (<LanguageIcon sx={{ flexGrow: 0, marginRight: '10px' }} />) :
                                    (<></>)
                    }
                    <Box className='nav-node-text' sx={{ flexGrow: 1 }}>
                        {props.title}
                    </Box>
                    {
                        props.type === 'request' ?
                            (
                                <IconButton sx={{ flexGrow: 0, minHeight: '40px' }} onClick={(e) => handleShowNavigationMenu(e, 'menu-auth')}>
                                    <MoreVertIcon />
                                </IconButton>
                            )
                            :
                            (

                                <IconButton sx={{ flexGrow: 0, minHeight: '40px' }} onClick={(e) => {
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
        item: NavigationListItem
    }) {
        let onSelect: (id: string) => void
        let onDelete: (item: NavigationListItem) => void
        let onMove: (id: string, destinationID: string | null) => void

        switch (props.type) {
            case 'request':
                onSelect = handleSelectRequest
                onDelete = handleDeleteRequest
                onMove = handleMoveRequest
                break;
            case 'auth':
                onSelect = handleSelectAuth
                onDelete = handleDeleteAuth
                onMove = handleMoveAuth
                break;
            case 'env':
                onSelect = handleSelectEnv
                onDelete = handleDeleteEnv
                onMove = handleMoveEnv
                break;
            default:
                throw new Error('Invalid nav type')
        }

        const { attributes, listeners, setNodeRef: setDragRef, transform } = useDraggable({
            id: props.item.id,
            data: {
                type: props.type,
                move: (destinationID: string) => onMove(props.item.id, destinationID)
            } as DraggableData
        })

        const dragStyle = {
            transform: CSS.Translate.toString(transform)
        }

        const { isOver, setNodeRef: setDropRef } = useDroppable({
            id: props.item.id,
            data: {
                isHeader: false,
                acceptsType: props.type
            } as DroppableData
        })

        return Array.isArray(props.item.children)
            ?
            (
                <TreeItem
                    nodeId={props.item.id}
                    key={`hdr-${props.type}`}
                    ref={useCombinedRefs(setDragRef, setDropRef)}
                    id={props.item.id}
                    style={dragStyle}
                    {...listeners}
                    {...attributes}
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onSelect(props.item.id)
                    }}
                    onFocusCapture={e => e.stopPropagation()}
                    sx={{ backgroundColor: isOver ? 'green' : 'default' }}
                    label={(
                        <Box
                            // ref={ref}
                            component='span'
                            display='flex'
                            justifyContent='space-between'
                            alignItems='center'
                        >
                            <FolderIcon sx={{ flexGrow: 0, marginRight: '10px' }} />
                            <Box className='nav-node-text' sx={{ flexGrow: 1 }}>{GetEditableTitle(props.item)} (Group)</Box>
                            <IconButton
                                sx={{
                                    visibility: props.item.id === selected ? 'normal' : 'hidden'
                                }}
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    onDelete(props.item)
                                }}
                            >
                                <DeleteIcon />
                            </IconButton>
                        </Box>
                    )}>
                    {props.item.children.map(c => (
                        <NavTreeItem type={props.type} item={c} key={`nav-${c.id}`} />
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
                    onSelect(props.item.id)
                }}
                onFocusCapture={e => e.stopPropagation()}
                sx={{ backgroundColor: isOver ? 'green' : 'default' }}
                label={(
                    <Box
                        component='span'
                        display='flex'
                        justifyContent='space-between'
                        alignItems='center'
                    >
                        {
                            Array.isArray(props.item.children)
                                ? <FolderIcon sx={{ flexGrow: 0, marginRight: '10px' }} />
                                : null
                        }
                        <Box className='nav-node-text'>{GetEditableTitle(props.item)}</Box>
                        <IconButton
                            sx={{
                                visibility: props.item.id === selected ? 'normal' : 'hidden'
                            }}
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                onDelete(props.item)
                            }}
                        >
                            <DeleteIcon />
                        </IconButton>
                    </Box>
                )} />)
    }

    const handleShowNavigationMenu = (event: React.MouseEvent, id: string) => {
        event.preventDefault()
        event.stopPropagation()
        dispatch(setNavigationMenu(
            {
                id,
                mouseX: event.clientX - 1,
                mouseY: event.clientY - 6,
            }
        ))
    }

    const clearNavigationMenu = () => {
        dispatch(setNavigationMenu(undefined))
    }

    const clearAllSelections = () => {
        dispatch(setActiveRequest({ id: undefined }))
        dispatch(setActiveAuthorization({ id: undefined }))
        dispatch(setActiveEnvironment({ id: undefined }))
        setSelected('')
    }

    const selectRequest = (id: string) => {
        dispatch(setActiveRequest({ id }))
        setSelected(id)
    }

    const selectAuthorization = (id: string) => {
        dispatch(setActiveAuthorization({ id }))
        setSelected(id)
    }

    const selectEnvironment = (id: string) => {
        dispatch(setActiveEnvironment({ id }))
        setSelected(id)
    }

    const handleCloseRequestMenu = () => {
        clearNavigationMenu()
    }

    const handleSelectHeader = (e: SyntheticEvent) => {
        e.preventDefault()
        e.stopPropagation()
        clearAllSelections()
        clearNavigationMenu()
    }

    const handleAddRequest = (e: SyntheticEvent) => {
        e.stopPropagation()
        clearNavigationMenu()
        dispatch(addNewRequest())
    }

    const handleAddRequestGroup = (e: SyntheticEvent) => {
        e.stopPropagation()
        clearNavigationMenu()
        dispatch(addNewRequestGroup())
    }

    const handleDeleteRequest = (item: NavigationListItem) => {
        confirm({
            title: 'Delete Request',
            message: `Are you are you sure you want to delete ${GetEditableTitle(item)}?`,
            okButton: 'Yes',
            cancelButton: 'No',
            defaultToCancel: true
        }).then((result) => {
            if (result) {
                clearAllSelections()
                dispatch(deleteRequest(item.id))
            }
        })
    }

    const handleSelectRequest = (id: string) => {
        dispatch(setActiveRequest({ id }))
        selectRequest(id)
    }

    const handleMoveRequest = (id: string, destinationID: string | null) => {
        dispatch(moveRequest({ id, destinationID }))
    }

    const handleAddAuth = () => {
        dispatch(addNewAuthorization())
    }

    const handleDeleteAuth = (item: NavigationListItem) => {
        confirm({
            title: 'Delete Authorization',
            message: `Are you are you sure you want to delete ${GetEditableTitle(item)}?`,
            okButton: 'Yes',
            cancelButton: 'No',
            defaultToCancel: true
        }).then((result) => {
            if (result) {
                clearAllSelections()
                dispatch(deleteAuthorization(item.id))
            }
        })
    }

    const handleSelectAuth = (id: string) => {
        dispatch(setActiveAuthorization({ id }))
        selectAuthorization(id)
    }

    const handleMoveAuth = (id: string, destinationID: string | null) => {
        console.log(`Moving auth ${id} to ${destinationID}`)
        dispatch(moveAuthorization({ id, destinationID }))
    }

    const handleAddEnv = () => {
        dispatch(addNewEnvironment())
    }

    const handleDeleteEnv = (env: NavigationListItem) => {
        confirm({
            title: 'Delete Environment',
            message: `Are you are you sure you want to delete ${(env.name?.length ?? 0) > 0 ? env.name : '(Unnamed)'}?`,
            okButton: 'Yes',
            cancelButton: 'No',
            defaultToCancel: true
        }).then((result) => {
            if (result) {
                clearAllSelections()
                dispatch(deleteEnvironment(env.id))
            }
        })
    }

    const handleSelectEnv = (id: string) => {
        dispatch(setActiveEnvironment({ id }))
        selectEnvironment(id)
    }

    const handleMoveEnv = (id: string, destinationID: string | null) => {
        dispatch(moveEnvironment({ id, destinationID }))
    }

    function RequestsMenu() {
        return (
            <Menu
                id='requests-menu'
                open={navigationMenu !== undefined}
                onClose={handleCloseRequestMenu}
                anchorReference='anchorPosition'
                anchorPosition={{
                    top: navigationMenu?.mouseY ?? 0,
                    left: navigationMenu?.mouseX ?? 0
                }}
            >
                <MenuItem onClick={(e) => handleAddRequest(e)}>
                    <ListItemIcon>
                        <SendIcon fontSize='small' />
                    </ListItemIcon>
                    <ListItemText>Add Request</ListItemText>
                </MenuItem>
                <MenuItem onClick={(e) => handleAddRequestGroup(e)}>
                    <ListItemIcon>
                        <FolderIcon fontSize='small' />
                    </ListItemIcon>
                    <ListItemText>Add Folder</ListItemText>
                </MenuItem>
            </Menu>
        )
    }
    const onDragEnd = (e: DragEndEvent) => {
        const { active, over } = e
        if (!over) return
        const activeData = active.data.current as unknown as DraggableData
        const overData = over.data.current as unknown as DroppableData

        if (activeData.type === overData.acceptsType) {
            activeData.move(overData.isHeader ? null : over.id.toString())
        }
    }

    return (
        <Stack direction='column' className='selection-pane' sx={{ flexShrink: 0, bottom: 0, overflow: 'auto', marginTop: '24px', paddingRight: '48px' }}>
            <DndContext onDragEnd={onDragEnd}>
                <TreeView
                    disableSelection
                    id='navigation'
                    key='navigation'
                    aria-label='request navigator'
                    defaultCollapseIcon={<ExpandMoreIcon />}
                    defaultExpandIcon={<ChevronRightIcon />}
                    defaultExpanded={['hdr-request', 'hdr-auth', 'hdr-env']}
                    onNodeSelect={(e: React.SyntheticEvent) => e.stopPropagation()}
                    selected={selected}
                    // onNodeFocus={(e: React.SyntheticEvent, id: string) => handleNodeFocus(id)}
                    sx={{ height: '100vh', flexGrow: 1, maxWidth: 400, overflowY: 'auto' }}
                >
                    <NavTreeSection key='nav-section-request' type='request' title='Requests' onAdd={() => { }}>
                        {
                            requests.map(t => <NavTreeItem item={t} type='request' key={`nav-section-${t.id}`} />)
                        }
                    </NavTreeSection>
                    <NavTreeSection key='nav-section-auth' type='auth' title='Authorizations' onAdd={handleAddAuth}>
                        {
                            authorizations.map(t => <NavTreeItem item={t} type='auth' key={`nav-section-${t.id}`} />)
                        }
                    </NavTreeSection>
                    <NavTreeSection key='nav-section-env' type='env' title='Environments' onAdd={handleAddEnv}>
                        {
                            environments.map(t => <NavTreeItem item={t} type='env' key={`nav-section-${t.id}`} />)
                        }
                    </NavTreeSection>
                </TreeView>
            </DndContext>
            <RequestsMenu />
        </Stack>
    )
}
