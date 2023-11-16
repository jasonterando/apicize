import { RootState } from "../../../models/store"
import { useSelector } from "react-redux"
import { TestEditor } from "../test/test-editor"
import { AuthorizationEditor } from "../authorization/authorization-editor"

export function MainEditor() {
    const activeTest = useSelector((state: RootState) => state.activeTest)
    const activeAuth = useSelector((state: RootState) => state.activeAuthorization)

    return (
        activeTest ? <TestEditor test={activeTest} />
            : activeAuth ? <AuthorizationEditor authorization={activeAuth} />
                : null
    )
}