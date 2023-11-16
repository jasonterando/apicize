import { TreeView } from '@mui/x-tree-view/TreeView'
import { TreeItem } from '@mui/x-tree-view/TreeItem'
import FolderIcon from '@mui/icons-material/Folder'
import ScienceIcon from '@mui/icons-material/Science'
import LockIcon from '@mui/icons-material/Lock';
import ExpandMoreIcon from '@mui/icons-material/ExpandMoreSharp'
import ChevronRightIcon from '@mui/icons-material/ChevronRightSharp'
import DeleteIcon from '@mui/icons-material/DeleteOutlined'
import { Box, Button, ButtonGroup, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Menu, MenuItem, MenuList, Paper, Toolbar, Typography } from '@mui/material'
import { RootState, addNewAuthorization, addNewTest, deleteAuthorization, deleteTest, setActiveAuthorization, setActiveTest } from '../../models/store'
import { useDispatch, useSelector } from 'react-redux'
import AddIcon from '@mui/icons-material/Add'
import React, { MouseEvent, SyntheticEvent } from 'react'
import { GetEditableTitle, NO_AUTHORIZATION } from '@apicize/definitions';


export function Navigation() {
    
    const tests = useSelector((state: RootState) => state.tests)
    const authorizations = useSelector((state: RootState) => state.authorizations)
    const activeTest = useSelector((state: RootState) => state.activeTest)
    const activeAuth = useSelector((state: RootState) => state.activeAuthorization)
    const [selected, setSelected] = React.useState<string | undefined>()
    const dispatch = useDispatch()

    const [testsMenu, setTestsMenu] = React.useState<{
        id: string
        mouseX: number
        mouseY: number
    } | null>(null)

    const handleShowTestsMenu = (event: React.MouseEvent, id: string) => {
        event.preventDefault()
        setTestsMenu(
            testsMenu === null
                ? {
                    id,
                    mouseX: event.clientX - 1,
                    mouseY: event.clientY - 6,
                }
                : // repeated contextmenu when it is already open closes it with Chrome 84 on Ubuntu
                // Other native context menus might behave different.
                // With this behavior we prevent contextmenu from the backdrop to re-locale existing context menus.
                null,
        )
    }

    const updateEditor = (testID?: string, authID?: string) => {
        dispatch(setActiveTest({ id: testID }))
        dispatch(setActiveAuthorization({ id: authID }))
    }

    const handleCloseTestMenu = () => {
        setTestsMenu(null)
    }

    const handleSelectHeader = () => {
        updateEditor();
        setTestsMenu(null)
    }

    const handleAddTest = (e: SyntheticEvent) => {
        e.stopPropagation()
        setTestsMenu(null)
        dispatch(addNewTest())
    }
   
    const handleDeleteTest = (e: MouseEvent, id: string) => {
        e.stopPropagation()
        updateEditor(undefined, undefined);
        dispatch(deleteTest({ id }))
    }

    const handleSelectTest = (id: string) => {
        dispatch(setActiveTest({id}));
        setSelected(id)
        updateEditor(id);
    }

    const handleAddAuth = (e: SyntheticEvent) => {
        e.stopPropagation()
        dispatch(addNewAuthorization())
    }

    const handleDeleteAuth = (e: MouseEvent, id: string) => {
        updateEditor(undefined, undefined);
        dispatch(deleteAuthorization({ id }))
    }

    const handleSelectAuth = (id: string) => {
        dispatch(setActiveAuthorization({id}));
        setSelected(id)
        updateEditor(undefined, id);
    }

    function TestsMenu() {
        return (
            <Menu
                open={testsMenu !== null}
                onClose={handleCloseTestMenu}
                anchorReference='anchorPosition'
                anchorPosition={
                    testsMenu !== null
                        ? { top: testsMenu.mouseY, left: testsMenu.mouseX }
                        : undefined
                }
            >
                <MenuItem>
                    <ListItemIcon>
                        <FolderIcon fontSize='small' />
                    </ListItemIcon>
                    <ListItemText>Add Folder</ListItemText>
                </MenuItem>
                <MenuItem onClick={(e) => handleAddTest(e)}>
                    <ListItemIcon>
                        <ScienceIcon fontSize='small' />
                    </ListItemIcon>
                    <ListItemText>Add Test</ListItemText>
                </MenuItem>
            </Menu>
        )
    }

    React.useEffect(() => {
        setSelected(activeTest?.id)
    }, [activeTest])

    React.useEffect(() => {
        setSelected(activeAuth?.id)
    }, [activeAuth])

    return (
        <Box>
            <List disablePadding>
                <ListItemButton 
                    key='nav-tests'
                    onClick={() => handleSelectHeader()}>
                    <ListItemIcon>
                        <ScienceIcon />
                    </ListItemIcon>
                    <ListItemText primary='Tests' />
                    <IconButton onClick={(e) => handleAddTest(e)}>
                        <AddIcon />
                    </IconButton>
                </ListItemButton>
                {tests.map(t => {
                    return (<ListItemButton
                        key={t.id}
                        sx={{ pl: 6}}
                        selected={t.id === selected}
                        onClick={() => handleSelectTest(t.id)}>
                        <ListItemText primary={GetEditableTitle(t)} />
                        <IconButton onClick={(e) => handleDeleteTest(e, t.id)}>
                            <DeleteIcon />
                        </IconButton>
                    </ListItemButton>);
                })}

                <ListItemButton 
                    key='nav-auths'
                    onClick={() => handleSelectHeader()}>
                    <ListItemIcon>
                        <LockIcon />
                    </ListItemIcon>
                    <ListItemText primary='Authorizations' />
                    <IconButton onClick={(e) => handleAddAuth(e)}>
                        <AddIcon />
                    </IconButton>
                </ListItemButton>
                {authorizations.filter(a => a.id !== NO_AUTHORIZATION).map(a => {
                    return (<ListItemButton
                        key={a.id}
                        sx={{ pl: 6 }}
                        selected={a.id === selected}
                        onClick={() => handleSelectAuth(a.id)}>
                        <ListItemText primary={GetEditableTitle(a)} />
                        <IconButton onClick={(e) => handleDeleteAuth(e, a.id)}>
                            <DeleteIcon />
                        </IconButton>
                    </ListItemButton>);
                })}

            </List>


            {/* <TreeView
                disableSelection
                aria-label='test navigator'
                defaultCollapseIcon={<ExpandMoreIcon />}
                defaultExpandIcon={<ChevronRightIcon />}
                defaultExpanded={['Tests', 'Auth', 'Env']}
                selected={selected}
                onNodeSelect={(e: React.SyntheticEvent) => e.stopPropagation()}
                onNodeFocus={(e: React.SyntheticEvent, id: string) => handleNodeFocus(id)}

                sx={{ height: '100vh', flexGrow: 1, maxWidth: 400, overflowY: 'auto' }}
            >
                <TreeItem
                    nodeId='Tests'
                    label={(
                        <Box
                            component='span'
                            display='flex'
                            justifyContent='space-between'
                            alignItems='center'
                        >
                            <Box
                                component='span'
                                justifyContent='space-between'
                                alignItems='left'>
                                <ScienceIcon sx={{ verticalAlign: 'middle', marginRight: '8px' }} />
                                Tests
                            </Box>
                            <IconButton onClick={(e) => handleShowTestsMenu(e, 'tests')}>
                                <AddIcon />
                            </IconButton>

                        </Box>
                    )}>
                    {
                        tests.map(t => {
                            return (<TreeItem key={t.id}
                                nodeId={`test-${t.id}`}
                                label={(
                                    <Box
                                        component='span'
                                        display='flex'
                                        justifyContent='space-between'
                                        alignItems='center'
                                    >
                                        {t.name}
                                        <IconButton onClick={(e) => handleDeleteTest(e, t.id)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
                                )} />)
                        })
                    }
                </TreeItem>
                <TreeItem
                    nodeId='Auth'
                    label={(
                        <Box
                            component='span'
                            display='flex'
                            justifyContent='space-between'
                            alignItems='center'
                        >
                            <Box
                                component='span'
                                justifyContent='space-between'
                                alignItems='left'>
                                <LockIcon sx={{ verticalAlign: 'middle', marginRight: '8px' }} />
                                Authorizations
                            </Box>
                            <IconButton onClick={handleAddAuth}>
                                <AddIcon />
                            </IconButton>

                        </Box>
                    )}>
                    {
                        authorizations.filter(a => a.id !== NO_AUTHORIZATION).map(t => {
                            return (<TreeItem key={t.id}
                                nodeId={`auth-${t.id}`}
                                label={(
                                    <Box
                                        component='span'
                                        display='flex'
                                        justifyContent='space-between'
                                        alignItems='center'
                                    >
                                        {t.name}
                                        <IconButton onClick={(e) => handleDeleteAuth(e, t.id)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
                                )} />)
                        })
                    }
                </TreeItem>
                <TreeItem nodeId='Env' label='Environment'>
                    <TreeItem nodeId='2' label='Calendar' />
                </TreeItem>
            </TreeView>*/}


            <TestsMenu />
        </Box>
    )
}