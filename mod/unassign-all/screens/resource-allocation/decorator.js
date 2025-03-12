import { MustGetElement, MustGetElements } from '/core/ui/utilities/utilities-dom.js';
import ActionHandler from '/core/ui/input/action-handler.js';
import ResourceAllocation from '/base-standard/ui/resource-allocation/model-resource-allocation.js';
import { AllResourcesUnassignedEventName } from 'mod/events/all-resources-unassigned.js';

class ScreenResourceAllocationDecorator {
    constructor(val) {
        this.screen = val;
        this.assignedResourceUnassignListener = this.onAssignedResourceUnassign.bind(this);
        this.allResourcesUnassignedListener = this.onAllResourcesUnassigned.bind(this);
        this.factoryResourceAssignedListener = this.onFactoryResourceAssigned.bind(this);
        this.factoryResourceUnassignedListener = this.onFactoryResourceUnassigned.bind(this);
    }

    beforeAttach() { }

    afterAttach() {
        this.addCitiesFilter();
        this.removeSettlementTypeNames();
        this.setupQuickResourceUnassignment();
        this.addUnassignAllButton();
        this.enhanceFactorySlots();
    }

    beforeDetach() { }

    afterDetach() { 
        this.screen.Root.removeEventListener(AllResourcesUnassignedEventName, this.allResourcesUnassignedListener);
    }

    onAttributeChanged(name, prev, next) { }

    addCitiesFilter() {
        this.onShowTownsChanged = (e) => {
            const showTowns = e.detail.value;
            this.screen.Root.querySelectorAll(".city-outer").forEach(cityEntry => {
                const settlementType = cityEntry.getAttribute("settlement-type");
                const isTown = settlementType === "Town";
                if (isTown) cityEntry.classList.toggle("hidden", !showTowns);
                
            });
        };
        this.onShowCitiesChanged = (e) => {
            const showCities = e.detail.value;
            this.screen.Root.querySelectorAll(".city-outer").forEach(cityEntry => {
                const settlementType = cityEntry.getAttribute("settlement-type");
                const isCity = settlementType !== "Town";
                if (isCity) cityEntry.classList.toggle("hidden", !showCities);
            });
        };

        const showCities = MustGetElement(".show-cities", this.screen.Root);
        showCities.removeEventListener('component-value-changed', this.screen.onShowTownsChanged);
        showCities.previousSibling.setAttribute('data-l10n-id', 'LOC_UI_RESOURCE_ALLOCATION_SHOW_CITIES');
        showCities.addEventListener('component-value-changed', this.onShowCitiesChanged);

        const showTownsContainer = document.createElement('div');
        showTownsContainer.className = 'relative flex items-end mr-3';
        const showTownsLabel = document.createElement('div');
        showTownsLabel.className = 'font-body text-xs mb-1';
        showTownsLabel.setAttribute('data-l10n-id', 'LOC_UI_RESOURCE_ALLOCATION_SHOW_TOWNS');
        showTownsLabel.setAttribute('selected', 'true');
        const checkbox = document.createElement('fxs-checkbox');
        checkbox.className = 'show-towns';
        checkbox.setAttribute("selected", "true");
        checkbox.addEventListener('component-value-changed', this.onShowTownsChanged);
        showTownsContainer.appendChild(showTownsLabel);
        showTownsContainer.appendChild(checkbox);

        const cityFilterContainer = MustGetElement('.city-filter-container', this.screen.Root);
        cityFilterContainer.insertBefore(showTownsContainer, showCities.parentNode.nextSibling);
    }

    removeSettlementTypeNames() {
        const settlementTypeNames = MustGetElements('.settlement-type-text', this.screen.Root);
        settlementTypeNames.forEach((settlementTypeName) => settlementTypeName.style.visibility = 'hidden');
    }

    setupQuickResourceUnassignment() {
        const cityResources = MustGetElements('.city-resource', this.screen.Root);
        cityResources.forEach(cityResource => 
            cityResource.addEventListener('auxclick', this.assignedResourceUnassignListener));
    }

    addUnassignAllButton() {
        const cityHeaderContainer = MustGetElement('.city-header-container', this.screen.Root);
        const cityFilterContainer = MustGetElement('.city-filter-container', this.screen.Root);
        cityHeaderContainer.classList.remove('grow');
        cityFilterContainer.classList.remove('grow');
        cityHeaderContainer.insertAdjacentHTML(
            'afterend', 
            `<div class="flex grow w-100 justify-end mr-10">
                <unassign-all-resources-button></unassign-all-resources-button>
            </div>`
        );

        this.screen.Root.addEventListener(AllResourcesUnassignedEventName, this.allResourcesUnassignedListener);
    }

    onAssignedResourceUnassign(event) {
        if (!(event.target instanceof HTMLElement)) {
            return;
        }
        if (ActionHandler.isGamepadActive) {
            return;
        }
        const resourceValueAttribute = event.target.getAttribute('data-resource-value');
        const resourceClassAttribute = event.target.getAttribute('data-resource-class');
        if (!resourceValueAttribute || !resourceClassAttribute) {
            console.error('screen-resource-allocation: onAssignedResourceActivate(): Failed to get attributes for resource!');
            return;
        }

        const resourceValue = parseInt(resourceValueAttribute);
        ResourceAllocation.unassignResource(resourceValue);
        this.refreshStates();
    }

    onAllResourcesUnassigned(event) {
        this.refreshStates();
    }

    refreshStates() {
        this.screen.updateCityEntriesDisabledState();
        this.screen.updateAvailableResourceColDisabledState();
        this.screen.updateAllUnassignActivatable();
        this.screen.focusCityList();
    }

    enhanceFactorySlots() {
        const factorySlots = MustGetElements('.city-factory-resource-container > fxs-activatable');
        
        const containers = MustGetElements('.city-factory-resource-container');
        containers.forEach(container => {
            const emptySlot = MustGetElement('fxs-activatable', container); 
            emptySlot.setAttribute('data-bind-class-toggle', `bg-accent-4:{{g_ResourceAllocationModel}}.hasFactoryResourceSelected();opacity-70:(!!{{g_ResourceAllocationModel.selectedResourceClass}}&&!{{g_ResourceAllocationModel}}.hasfactoryResourceSelected())`);
        });
        
        factorySlots.forEach(slot => slot.removeEventListener('action-activate', this.screen.cityActivateListener));
        factorySlots.forEach(slot => slot.addEventListener('action-activate', this.factoryResourceAssignedListener));
        
        factorySlots.forEach(slot => slot.addEventListener('auxclick', this.factoryResourceUnassignedListener));
    }

    onFactoryResourceAssigned(event) {
        const resourceValue = event.target.getAttribute('data-resource-value');
        if (!resourceValue) { // empty factory slot
            if (ResourceAllocation.hasSelectedResource()) {
                const cityID = event.target.parentElement?.getAttribute('data-city-id');
                const isSuccess = ResourceAllocation.fillCityWithFactoryResource(cityID);
                if (isSuccess) return;
            }
        };

        // fallback to default behavior
        this.screen.onCityActivate(event);
        return;
    }

    onFactoryResourceUnassigned(event) {
        const resourceValue = event.target.getAttribute('data-resource-value');
        const resourceClass = event.target.getAttribute('data-resource-class');
        if (!resourceValue || resourceClass !== 'RESOURCECLASS_FACTORY') return;

        const cityID = event.target.parentElement?.getAttribute('data-city-id');
        ResourceAllocation.unassignAllResourceInstancesFromCity(cityID, resourceValue);
    }
}

Controls.decorate('screen-resource-allocation', (val) => new ScreenResourceAllocationDecorator(val));