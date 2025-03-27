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
    Root: ComponentRoot<Component>

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
        this.addCitiesFilter()
        this.removeSettlementTypeNames()
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

    addCitiesFilter() {
        this.onShowTownsChanged = (event: CustomEvent<{ value: boolean }>) => {
            const showTowns = event.detail.value
            this.Root.querySelectorAll('.city-outer').forEach(
                (cityEntry: Element) => {
                    const settlementType =
                        cityEntry.getAttribute('settlement-type')
                    const isTown = settlementType === 'Town'
                    if (isTown) cityEntry.classList.toggle('hidden', !showTowns)
                }
            )
        }
        this.onShowCitiesChanged = (event: CustomEvent<{ value: boolean }>) => {
            const showCities = event.detail.value
            this.Root.querySelectorAll('.city-outer').forEach(
                (cityEntry: Element) => {
                    const settlementType =
                        cityEntry.getAttribute('settlement-type')
                    const isCity = settlementType !== 'Town'
                    if (isCity)
                        cityEntry.classList.toggle('hidden', !showCities)
                }
            )
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
