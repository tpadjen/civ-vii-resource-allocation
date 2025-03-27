import { AllResourcesUnassignedEventName } from '../model/events.js'
import {
    ExtendedResourceAllocation,
    ScreenResourceAllocationType,
} from '../types.js'
import ResourceAllocation from '/base-standard/ui/resource-allocation/model-resource-allocation.js'
import ActionHandler from '/core/ui/input/action-handler.js'
import {
    MustGetElement,
    MustGetElements,
} from '/core/ui/utilities/utilities-dom.js'

class ScreenResourceAllocationDecorator {
    private assignedResourceUnassignListener: (event: any) => void
    private allResourcesUnassignedListener: (event: any) => void
    private factoryResourceAssignedListener: (event: any) => void
    private factoryResourceUnassignedListener: (event: any) => void
    private screen: ScreenResourceAllocationType
    private onShowTownsChanged: (event: any) => void
    private onShowCitiesChanged: (event: any) => void
    private onShowFactoriesChanged: (event: any) => void
    Root: ComponentRoot<Component>
    showingTowns: boolean = true
    showingCities: boolean = true
    showingOnlyFactories: boolean = false

    constructor(val: ScreenResourceAllocationType) {
        this.screen = val
        this.Root = this.screen.Root
        this.assignedResourceUnassignListener =
            this.onAssignedResourceUnassign.bind(this)
        this.allResourcesUnassignedListener =
            this.onAllResourcesUnassigned.bind(this)
        this.factoryResourceAssignedListener =
            this.onFactoryResourceAssigned.bind(this)
        this.factoryResourceUnassignedListener =
            this.onFactoryResourceUnassigned.bind(this)
    }

    beforeAttach() {}

    afterAttach() {
        this.setupCityFilter()
        this.setupTownFilter()
        this.setupFactoryFilter()
        this.removeSettlementTypeNames()
        this.addDistantLandsIcons()
        this.setupQuickResourceUnassignment()
        this.addUnassignAllButton()
        this.enhanceFactorySlots()
    }

    beforeDetach() {}

    afterDetach() {
        this.Root.removeEventListener(
            AllResourcesUnassignedEventName,
            this.allResourcesUnassignedListener
        )
    }

    onAttributeChanged(name: string, prev: string, next: string) {}

    private toggleSettlementVisibilities() {
        this.Root.querySelectorAll('.city-outer').forEach(
            (cityEntry: Element) => {
                const settlementType = cityEntry.getAttribute('settlement-type')
                const hasFactory =
                    cityEntry.getAttribute('has-factory') === 'true'
                const isCity = settlementType !== 'Town'

                const isSettlementSelectedByType =
                    (isCity && this.showingCities) ||
                    (!isCity && this.showingTowns)

                const isSettlementVisible = this.showingOnlyFactories
                    ? isSettlementSelectedByType && hasFactory
                    : isSettlementSelectedByType

                cityEntry.classList.toggle('hidden', !isSettlementVisible)
            }
        )
    }

    private setupFactoryFilter() {
        this.onShowFactoriesChanged = (
            event: CustomEvent<{ value: boolean }>
        ) => {
            this.showingOnlyFactories = event.detail.value
            this.toggleSettlementVisibilities()
        }

        const showFactories = MustGetElement('.show-factories', this.Root)
        showFactories.removeEventListener(
            'component-value-changed',
            this.screen.onShowFactoriesChanged
        )
        showFactories.setAttribute('selected', 'false')
        ;(showFactories.previousSibling as HTMLElement).setAttribute(
            'data-l10n-id',
            'LOC_UI_RESOURCE_ALLOCATION_SHOW_ONLY_FACTORIES'
        )
        showFactories.addEventListener(
            'component-value-changed',
            this.onShowFactoriesChanged
        )
    }

    private setupCityFilter() {
        this.onShowCitiesChanged = (event: CustomEvent<{ value: boolean }>) => {
            this.showingCities = event.detail.value
            this.toggleSettlementVisibilities()
        }

        const showCities = MustGetElement('.show-cities', this.Root)
        showCities.removeEventListener(
            'component-value-changed',
            this.screen.onShowTownsChanged
        )
        ;(showCities.previousSibling as HTMLElement).setAttribute(
            'data-l10n-id',
            'LOC_UI_RESOURCE_ALLOCATION_SHOW_CITIES'
        )
        showCities.addEventListener(
            'component-value-changed',
            this.onShowCitiesChanged
        )
    }

    private setupTownFilter() {
        this.onShowTownsChanged = (event: CustomEvent<{ value: boolean }>) => {
            this.showingTowns = event.detail.value
            this.toggleSettlementVisibilities()
        }

        const showTownsContainer = document.createElement('div')
        showTownsContainer.className = 'relative flex items-end mr-3'
        const showTownsLabel = document.createElement('div')
        showTownsLabel.className = 'font-body text-xs mb-1'
        showTownsLabel.setAttribute(
            'data-l10n-id',
            'LOC_UI_RESOURCE_ALLOCATION_SHOW_TOWNS'
        )
        showTownsLabel.setAttribute('selected', 'true')
        const checkbox = document.createElement('fxs-checkbox')
        checkbox.className = 'show-towns'
        checkbox.setAttribute('selected', 'true')
        checkbox.addEventListener(
            'component-value-changed',
            this.onShowTownsChanged
        )
        showTownsContainer.appendChild(showTownsLabel)
        showTownsContainer.appendChild(checkbox)

        const cityFilterContainer = MustGetElement(
            '.city-filter-container',
            this.Root
        )

        const showCities = MustGetElement('.show-cities', this.Root)
        cityFilterContainer.insertBefore(
            showTownsContainer,
            showCities.parentNode.nextSibling
        )
    }

    removeSettlementTypeNames() {
        const settlementTypeNames = MustGetElements(
            '.settlement-type-text',
            this.Root
        )
        settlementTypeNames.forEach(
            (settlementTypeName: HTMLElement) =>
                (settlementTypeName.style.visibility = 'hidden')
        )
    }

    private getDistantLandsCityIds() {
        const localPlayerID: PlayerId = GameContext.localPlayerID
        const localPlayer: PlayerLibrary | null = Players.get(localPlayerID)
        if (!localPlayer) {
            console.error(
                `model-resource-allocation: Failed to retrieve PlayerLibrary for Player ${localPlayerID}`
            )
            return
        }
        const playerCities: PlayerCities | undefined = localPlayer.Cities
        if (!playerCities) {
            console.error(
                `model-resource-allocation: Failed to retrieve Cities for Player ${localPlayerID}`
            )
            return
        }

        const distantLandsCityIds = playerCities
            .getCityIds()
            .filter((cityID) => Cities.get(cityID)?.isDistantLands)
            .map((cityID) => cityID.id)

        return distantLandsCityIds
    }

    addDistantLandsIcons() {
        // Wait for the city IDs to be data bound
        const waitForCityId: Promise<void> = new Promise((resolve) => {
            const waitForCityIdHandler = setInterval(() => {
                const cityEntries = this.Root.querySelectorAll('.city-entry')
                const cityID = cityEntries[0].getAttribute('data-city-id')
                if (cityID) {
                    clearInterval(waitForCityIdHandler)
                    resolve()
                }
            }, 20)
        })

        const distantLandsCityIds = this.getDistantLandsCityIds()
        const distantLandsIcon = `<div style="padding-left: 10px;">
                                    <fxs-icon class="size-8 bg-no-repeat bg-center" data-icon-id="NOTIFICATION_DISCOVER_CONTINENT"></fxs-icon>
                                  </div>`

        waitForCityId.then(() => {
            this.Root.querySelectorAll('.city-entry').forEach(
                (cityEntry: Element) => {
                    const settlementName = MustGetElement(
                        '.settlement-name-text',
                        cityEntry as HTMLElement
                    )

                    const cityID = cityEntry.getAttribute('data-city-id')

                    const isDistantLands = distantLandsCityIds.some(
                        (id) => id == cityID
                    )
                    if (isDistantLands) {
                        settlementName.insertAdjacentHTML(
                            'afterend',
                            distantLandsIcon
                        )
                    }
                }
            )
        })
    }

    setupQuickResourceUnassignment() {
        const cityResources = MustGetElements('.city-resource', this.Root)
        cityResources.forEach((cityResource: HTMLElement) =>
            cityResource.addEventListener(
                'auxclick',
                this.assignedResourceUnassignListener
            )
        )
    }

    addUnassignAllButton() {
        const cityHeaderContainer = MustGetElement(
            '.city-header-container',
            this.Root
        )
        const cityFilterContainer = MustGetElement(
            '.city-filter-container',
            this.Root
        )
        cityHeaderContainer.classList.remove('grow')
        cityFilterContainer.classList.remove('grow')
        cityHeaderContainer.insertAdjacentHTML(
            'afterend',
            `<div class="flex grow w-100 justify-end mr-10">
                <unassign-all-resources-button></unassign-all-resources-button>
            </div>`
        )

        this.Root.addEventListener(
            AllResourcesUnassignedEventName,
            this.allResourcesUnassignedListener
        )
    }

    onAssignedResourceUnassign(event: CustomEvent<void>) {
        if (!(event.target instanceof HTMLElement)) {
            return
        }
        if (ActionHandler.isGamepadActive) {
            return
        }
        const resourceValueAttribute = event.target.getAttribute(
            'data-resource-value'
        )
        const resourceClassAttribute = event.target.getAttribute(
            'data-resource-class'
        )
        if (!resourceValueAttribute || !resourceClassAttribute) {
            console.error(
                'screen-resource-allocation: onAssignedResourceActivate(): Failed to get attributes for resource!'
            )
            return
        }

        const resourceValue = parseInt(resourceValueAttribute)
        ResourceAllocation.unassignResource(resourceValue)
        this.refreshStates()
    }

    onAllResourcesUnassigned(event: CustomEvent<void>) {
        this.refreshStates()
    }

    refreshStates() {
        this.screen.updateCityEntriesDisabledState()
        this.screen.updateAvailableResourceColDisabledState()
        this.screen.updateAllUnassignActivatable()
        this.screen.focusCityList()
    }

    enhanceFactorySlots() {
        let factorySlots: NodeListOf<HTMLElement>
        try {
            factorySlots = MustGetElements(
                '.city-factory-resource-container > fxs-activatable'
            )
        } catch (error) {
            // no factory slots found
            return
        }

        const containers = MustGetElements('.city-factory-resource-container')
        containers.forEach((container: HTMLElement) => {
            const emptySlot = MustGetElement('fxs-activatable', container)
            emptySlot.setAttribute(
                'data-bind-class-toggle',
                `bg-accent-4:{{g_ResourceAllocationModel}}.hasFactoryResourceSelected();opacity-70:(!!{{g_ResourceAllocationModel.selectedResourceClass}}&&!{{g_ResourceAllocationModel}}.hasfactoryResourceSelected())`
            )
        })

        factorySlots.forEach((slot: HTMLElement) =>
            slot.removeEventListener(
                'action-activate',
                this.screen.cityActivateListener
            )
        )
        factorySlots.forEach((slot: HTMLElement) =>
            slot.addEventListener(
                'action-activate',
                this.factoryResourceAssignedListener
            )
        )

        factorySlots.forEach((slot: HTMLElement) =>
            slot.addEventListener(
                'auxclick',
                this.factoryResourceUnassignedListener
            )
        )
    }

    onFactoryResourceAssigned(event: CustomEvent<void>) {
        const resourceValue = (event.target as HTMLElement).getAttribute(
            'data-resource-value'
        )
        if (!resourceValue) {
            // empty factory slot
            if (ResourceAllocation.hasSelectedResource()) {
                const cityID = (
                    event.target as HTMLElement
                ).parentElement?.getAttribute('data-city-id')
                const isSuccess =
                    ExtendedResourceAllocation.fillCityWithFactoryResource(
                        cityID
                    )
                if (isSuccess) return
            }
        }

        // fallback to default behavior
        this.screen.onCityActivate(event)
        return
    }

    onFactoryResourceUnassigned(event: CustomEvent<void>) {
        const resourceValue = (event.target as HTMLElement).getAttribute(
            'data-resource-value'
        )
        const resourceClass = (event.target as HTMLElement).getAttribute(
            'data-resource-class'
        )
        if (!resourceValue || resourceClass !== 'RESOURCECLASS_FACTORY') return

        const cityID = (
            event.target as HTMLElement
        ).parentElement?.getAttribute('data-city-id')
        ExtendedResourceAllocation.unassignAllResourceInstancesFromCity(
            cityID,
            resourceValue
        )
    }
}

Controls.decorate(
    'screen-resource-allocation',
    (val: Component) =>
        new ScreenResourceAllocationDecorator(
            val as unknown as ScreenResourceAllocationType
        )
)
