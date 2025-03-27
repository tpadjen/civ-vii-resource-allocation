import ResourceAllocation from '/base-standard/ui/resource-allocation/model-resource-allocation.js'
import { ComponentID } from '/core/ui/utilities/utilities-component-id.js'

type ExtendedResourceAllocationType = typeof ResourceAllocation & {
    unassignAllResources: () => void
    fillCityWithFactoryResource: (cityID: string) => boolean
    unassignAllResourceInstancesFromCity: (
        cityID: string,
        resourceValue: string
    ) => void
}

export const ExtendedResourceAllocation =
    ResourceAllocation as ExtendedResourceAllocationType

export type ScreenResourceAllocationType = typeof Component & {
    onShowTownsChanged: (event: any) => void
    onShowCitiesChanged: (event: any) => void
    onShowFactoriesChanged: (event: any) => void
    updateCityEntriesDisabledState: () => void
    updateAvailableResourceColDisabledState: () => void
    updateAllUnassignActivatable: () => void
    focusCityList: () => void
    cityActivateListener: (event: any) => void
    onCityActivate: (event: any) => void
    Root: ComponentRoot
}

export type CityID = typeof ComponentID & {
    id: string
}
