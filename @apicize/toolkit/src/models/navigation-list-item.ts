export interface NavigationListItemBase {
    id: string
    name: string
    type: string
}

export interface NavigationListItemWithChildren<T> {
    id: string
    name: string
    type: string
    children?: T[]
}

export type NavigationListItem = NavigationListItemWithChildren<NavigationListItemBase>