import * as React from 'react';
import './test-editor.css';
import { ToggleButtonGroup, ToggleButton, Typography, Box, Stack } from '@mui/material';
import DisplaySettingsIcon from '@mui/icons-material/DisplaySettings';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewListOutlinedIcon from '@mui/icons-material/ViewListOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import { TestParameters } from './test-parameters';
import { TestHeaders } from './test-headers';
import ScienceIcon from '@mui/icons-material/Science'
import { TestQueryString } from './test-query-string';
import { TestBody } from './test-body';
import { EditableWorkbookTest } from '@apicize/definitions';

export function TestEditor(props: { test: EditableWorkbookTest }) {
    const [panel, setPanel] = React.useState<string>('Parameters');

    const handlePanelChanged = (event: React.SyntheticEvent, newValue: string) => {
        if (newValue) setPanel(newValue);
    };

    return (
        <Stack className='test-main'>
            <Box>
                <Box className='test-definition' sx={{ display: 'flex' }}>
                    <ToggleButtonGroup
                        className='button-column'
                        orientation='vertical'
                        exclusive
                        onChange={handlePanelChanged}
                        value={panel}
                        aria-label="text alignment">
                        <ToggleButton value="Parameters" title="Show Request Parameters" aria-label='show parameters'><DisplaySettingsIcon /></ToggleButton>
                        <ToggleButton value="Query String" title="Show Request Query String" aria-label='show query string'><ViewListIcon /></ToggleButton>
                        <ToggleButton value="Headers" title="Show Request Headers" aria-label='show headers'><ViewListOutlinedIcon /></ToggleButton>
                        <ToggleButton value="Body" title="Show Request Body" aria-label='show body'><ArticleOutlinedIcon /></ToggleButton>
                    </ToggleButtonGroup>
                    <div className='panels'>
                        <Typography variant='h1'><ScienceIcon /> {props?.test.name?.length ?? 0 > 0 ? props.test.name : '(Unnamed)'} - {panel}</Typography>
                        {panel === 'Parameters' ? <TestParameters test={props.test} />
                            : panel === 'Headers' ? <TestHeaders test={props.test} />
                                : panel === 'Query String' ? <TestQueryString test={props.test} />
                                    : panel === 'Body' ? <TestBody test={props.test} />
                                        : null}
                    </div>
                </Box>
                <div className="test-content">
                    <h3>Test Content</h3>
                </div>
            </Box>
        </Stack>
    );
}