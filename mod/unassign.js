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
};
engine.whenReady.then(() => {
    initialize();
    ResourceAllocation.updateCallback();
});