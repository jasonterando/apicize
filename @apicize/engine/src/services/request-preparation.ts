import { WorkbookRequest, WorkbookEnvironment, EditableWorkbookRequest } from "@apicize/definitions"
import { EditableWorkbookRequestToRequest } from "@apicize/definitions/dist/models/workbook/editable/editable-workbook-request"

type RegExValuePair = [RegExp, string]

export class RequestPreparation {

    private transformations: RegExValuePair[]

    public constructor(environment: WorkbookEnvironment) {
        this.transformations = (environment?.variables ?? [])
            .filter(v => ! v.disabled)
            .map(v => [new RegExp(`\{\{${v.name}\}\}`, 'g'), v.value])
    }

    public static transform(envsAsRegEx: RegExValuePair[], input: string | null | undefined): string {
        if (! (input && input.length > 0)) return ''

        let result = input
        for(const [regex, value] of envsAsRegEx) {
            result = result?.replace(regex, value)
        }
        return result
    }

    public cloneRequest(request: WorkbookRequest) {
        const cloned = structuredClone(request) as EditableWorkbookRequest
        cloned.test = undefined
        cloned.timeout = undefined
        cloned.running = undefined
        cloned.url = RequestPreparation.transform(this.transformations, cloned.url)
        cloned.queryStringParams = cloned.queryStringParams
            ?.filter(q => ! q.disabled)
        cloned.queryStringParams?.forEach(q => {
            (q as any).id = undefined
            q.value = RequestPreparation.transform(this.transformations, q.value)
        })
        cloned.headers = cloned.headers
            ?.filter(q => ! q.disabled)
        cloned.headers?.forEach(h => {
            (h as any).id = undefined
            h.value = RequestPreparation.transform(this.transformations, h.value)
        })
        if (cloned.body && (typeof cloned.body === 'string')) {
            cloned.body = RequestPreparation.transform(this.transformations, cloned.body)
        }
        return cloned
    }
}