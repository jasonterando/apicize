import { homedir } from 'os'
import { join } from 'path'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { Settings } from '@apicize/definitions'

export class SettingsProvider {
    private appDirectory: string
    private settingsFileName: string
    private _settings: Settings

    public constructor() {
        // Set up local storage
        this.appDirectory = homedir()
        if (this.appDirectory.length ?? 0 < 1) {
            this.appDirectory = join(homedir(), 'apicize')
        }

        if(! existsSync(this.appDirectory)) {
            mkdirSync(this.appDirectory)
        }

        // Read settings if they exist
        this.settingsFileName = join(this.appDirectory, '.apicize-settings.json')

        let settings: Settings | undefined
        if (existsSync(this.settingsFileName)) {
            try {
                settings = JSON.parse(readFileSync(this.settingsFileName).toString()) as Settings
            } catch(e) {
                console.error(`Unable to read setings file ${this.settingsFileName} (${e})`)
            }
        }

        if (settings == undefined) {
            settings = {
                workbookDirectory: ''
            }
        }

        if ((settings.workbookDirectory?.length ?? 0) < 0) {
            let workbookDirectory: string | undefined
            try {
                if (existsSync(this.settingsFileName)) {
                    const settingsData = JSON.parse(readFileSync(this.settingsFileName).toString())
                    workbookDirectory = settingsData.workbookDirectory.toString()
                }
            } catch(e) {
                console.error(`Unable to read settings (${e})`)
            }

            if (! (workbookDirectory && (workbookDirectory?.length ?? 0) > 0)) {
                workbookDirectory = join(this.appDirectory, 'workbooks')
            }

            if(! existsSync(workbookDirectory)) {
                mkdirSync(workbookDirectory)
            }

            settings.workbookDirectory = workbookDirectory
        }
        this._settings = settings
    }

    public saveSettings() {
        try {
            writeFileSync(this.settingsFileName, JSON.stringify(this._settings))
        } catch(e) {
            console.error(`Unable to write settings (${e})`)
        }
    }

    public get settings() {
        return this._settings
    }

    public set workbookDirectory(directory: string) {
        this._settings.workbookDirectory = directory
        this.saveSettings()
    }

    public set lastWorkbookFileName(fileName: string) {
        this._settings.lastWorkbookFileName = fileName
        this.saveSettings()
    }
}