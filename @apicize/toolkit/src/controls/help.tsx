import { useSelector } from 'react-redux'
import { WorkbookState, helpActions } from '../models/store'
import { Box, IconButton, Link, Typography, TypographyPropsVariantOverrides } from '@mui/material'
import HomeIcon from '@mui/icons-material/Home';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import { AnchorHTMLAttributes, HTMLAttributes, HtmlHTMLAttributes, useEffect } from 'react'
import { visit } from 'unist-util-visit';
import { Node as DastNode } from 'mdast';
import SendIcon from '@mui/icons-material/Send';
import DisplaySettingsIcon from '@mui/icons-material/DisplaySettings'
import ViewListIcon from '@mui/icons-material/ViewList'
import ViewListOutlinedIcon from '@mui/icons-material/ViewListOutlined'
import ScienceIcon from '@mui/icons-material/Science';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import AirlineStopsIcon from '@mui/icons-material/AirlineStops';
import { logo } from './logo';
import { Remark } from 'react-remark'
import { ComponentPropsWithNode } from 'rehype-react'
import RemarkDirective from 'remark-directive'
import { TextDirective, LeafDirective } from 'mdast-util-directive'
import { Element } from 'hast';
import { Variant } from '@mui/material/styles/createTypography';
import { OverridableStringUnion } from '@mui/types'

// Register `hName`, `hProperties` types, used when turning markdown to HTML:
/// <reference types="mdast-util-to-hast" />
// Register directive nodes in mdast:
/// <reference types="mdast-util-directive" />

export function HelpPanel(props: { showHelp: (topic: string) => void, hideHelp: () => void }) {
    let name = useSelector((state: WorkbookState) => state.navigation.appName)
    let version = useSelector((state: WorkbookState) => state.navigation.appVersion)
    let helpText = useSelector((state: WorkbookState) => state.help.helpText)
    let helpTopic = useSelector((state: WorkbookState) => state.help.helpTopic)
    let helpAnchor = useSelector((state: WorkbookState) => state.help.helpAnchor)
    let helpHistory = useSelector((state: WorkbookState) => state.help.helpTopicHistory)

    let showBack = helpHistory.length > 1
    let showHome = helpTopic !== 'home'

    useEffect(() => {
        if (helpAnchor.length > 0) {
            document.getElementById(helpAnchor)?.scrollIntoView(true)
        }
    }, [helpAnchor, helpText])


    function remarkLogoDirective() {
        return (tree: DastNode) => {
            visit(tree, 'leafDirective', function (node: LeafDirective) {
                if (node.name === 'logo') {
                    const data: any = node.data || (node.data = {})
                    data.hName = 'logo'
                    return
                }
            })
        }
    }

    function remarkInfoDirective() {
        return (tree: DastNode) => {
            visit(tree, 'textDirective', function (node: TextDirective) {
                if (node.name !== 'info' || node.children.length === 0) return
                const child = node.children[0]
                if (child.type !== 'text') return

                const data: any = node.data || (node.data = {})

                let replaceWith
                switch (child.value) {
                    case 'name':
                        replaceWith = name
                        break
                    case 'version':
                        replaceWith = version
                        break
                    default:
                        // if not an information item that we know about, ignore it
                        return
                }
                data.hName = 'span'
                data.hChildren = [
                    {
                        type: 'text',
                        value: replaceWith
                    }
                ]
            });
        }
    }

    function remarkIconDirective() {
        return (tree: DastNode) => {
            visit(tree, 'textDirective', function (node: TextDirective) {
                if (node.name !== 'icon' || node.children.length === 0) return
                const child = node.children[0]
                if (child.type !== 'text') return

                const data: any = node.data || (node.data = {})

                data.hName = 'icon'
                data.hProperties = { name: child.value }
                data.hChildren = []
            });
        }
    }

    const rehypeTransformHeader = (attrs: HTMLAttributes<unknown>) => {
        let id
        const attrsWithNode = attrs as ComponentPropsWithNode
        if (attrsWithNode.children && attrsWithNode.node) {
            if (Array.isArray(attrs.children)) {
                const first = attrs.children[0]
                if (first) id = first.toString()
            } else {
                id = attrsWithNode.children.toString()
            }
        }
        if (id) {
            id = id.trim().toLowerCase().replace(/[^\s\w]/g, '').replace(/\s/g, '-')
            const name = (attrsWithNode.node as Element).tagName as OverridableStringUnion<Variant | 'inherit', TypographyPropsVariantOverrides>
            return <Typography id={id} variant={name} {...attrsWithNode} />
        } else {
            return null;
        }
    }

    const rehypeTransformIcon = (attrs: HTMLAttributes<any>) => {
        const attrsWithNode = attrs as ComponentPropsWithNode
        const name = (attrsWithNode.node as any).properties.name
        switch (name) {
            case 'request':
                return <SendIcon className='help-icon' />
            case 'info':
                return <DisplaySettingsIcon className='help-icon' />
            case 'query':
                return <ViewListIcon className='help-icon' />
            case 'headers':
                return <ViewListOutlinedIcon className='help-icon' />
            case 'body':
                return <ArticleOutlinedIcon className='help-icon' />
            case 'test':
                return <AirlineStopsIcon className='help-icon' />
            case 'proxy':
                return <ScienceIcon className='help-icon' />
            default:
                return null
        }
    }

    const rehypeTranformAnchor = (attrs: AnchorHTMLAttributes<unknown>) => {
        if (attrs.href) {
            if (attrs.href.startsWith('help:')) {
                const topic = attrs.href.substring(5)
                attrs = { ...attrs, href: '#' }
                return <Link {...attrs} onClick={() => props.showHelp(topic)} />
            }
            else if (attrs.href.startsWith('icon:')) {
                return <DisplaySettingsIcon />
            }
        }
        return <Link {...attrs} />
    }
    return <Box className='help'>
        <Box className='help-toolbar'>
            {
                showHome
                    ? <IconButton color='primary' size='medium' aria-label='Home' title='Home' onClick={() => props.showHelp('home')}><HomeIcon fontSize='inherit' /></IconButton>
                    : <></>
            }
            {
                showBack
                    ? <IconButton color='primary' size='medium' aria-label='Back' title='Back' onClick={() => props.showHelp('\nback')}><ArrowBackIcon fontSize='inherit' /></IconButton>
                    : <></>
            }
            <IconButton color='primary' size='medium' aria-label='Close' title='Close' sx={{ marginLeft: '1rem' }} onClick={() => props.hideHelp()}><CloseIcon fontSize='inherit' /></IconButton>
        </Box>
        <Box className='help-text'>
            <Remark
                remarkPlugins={[RemarkDirective, remarkInfoDirective, remarkIconDirective, remarkLogoDirective]}
                rehypeReactOptions={{
                    passNode: true,
                    components: {
                        logo,
                        icon: rehypeTransformIcon,
                        h1: rehypeTransformHeader,
                        h2: rehypeTransformHeader,
                        h3: rehypeTransformHeader,
                        h4: rehypeTransformHeader,
                        h5: rehypeTransformHeader,
                        h6: rehypeTransformHeader,
                        a: rehypeTranformAnchor,
                        p: (attrs: HTMLAttributes<HTMLParagraphElement>) => <Typography variant='body1' {...attrs} />
                    }
                }}
            >
                {helpText}
            </Remark>
        </Box>
    </Box>
}
