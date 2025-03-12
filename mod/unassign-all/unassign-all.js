import ResourceAllocation from '/base-standard/ui/resource-allocation/model-resource-allocation.js';

const initialize = () => {
    const proto = Object.getPrototypeOf(ResourceAllocation);

    Object.defineProperty(proto, "assignedResources", {
        get: function assignedResources() {
            return this._availableCities.flatMap((city) => city.currentResources);
        }
    });

    Object.defineProperty(proto, "hasAnyResourceAssigned", {
        get: function hasAnyResourceAssigned() {
            return this.assignedResources.length > 0;
        }
    });

    proto.unassignAllResources = function() {
        // Must remove non-camels first
        this.assignedResources
            .filter((resource) => resource.type !== 'RESOURCE_CAMELS')
            .forEach((resource) => this.unassignResource(resource.value));

        const camelsInterval = setInterval(() => {
            // wait for all of the non-camel removals to be processed
            if (this.assignedResources.some((resource) => resource.type !== 'RESOURCE_CAMELS'))
                return;

            // Then the camels can go too
            this.assignedResources.forEach((resource) => this.unassignResource(resource.value));
            clearInterval(camelsInterval);
        }, 10);
    }

    proto.unassignAllResourceInstancesFromCity = function(cityID, resourceValue) {
        const city = this.availableCities.find((city => city.id.id == cityID));
        if (!city) return;
        const factoryResource = city.currentResources.find(resource => resource.value == resourceValue);
        if (!factoryResource) return;

        const matchingAssignedFactoryResources = 
            city.currentResources.filter(resource => 
                resource.name === factoryResource.name && resource.value !== factoryResource.value
            );
        matchingAssignedFactoryResources.forEach((resource) => this.unassignResource(resource.value));
    }
};
engine.whenReady.then(() => {
    initialize();
    ResourceAllocation.updateCallback();
});