import { Typography } from "@mui/material";
import { Box } from "@mui/system";
import { useSelector } from "react-redux";
import { WorkbookState } from "../models/store";

export function logo() {
    let name = useSelector((state: WorkbookState) => state.navigation.appName)
    let version = useSelector((state: WorkbookState) => state.navigation.appVersion)

    return <Box display='flex'>
        <Box>
            <img width='120px' height='120px' src='data:image/png;base64,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' />
        </Box>
        <Box marginLeft='24px'>
            <Typography variant='h1' fontSize='48px'>{name}</Typography>
            <Typography variant='h2' fontSize='18px'>{version}</Typography>
        </Box>

    </Box>

}