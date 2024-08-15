import { Box } from "@mui/system"
import { useFake } from "../contexts/fake-context"
import { Button } from "@mui/material"

export const FakeViewer = () => {
    const ctx = useFake()

    return (
        <Box display='block'>
            <h2>Current ID: {ctx.id}, Type: {ctx.type}</h2>
            <Button onClick={() => ctx.increment()}>Counter: {ctx.counter}</Button>
        </Box>
    )
}