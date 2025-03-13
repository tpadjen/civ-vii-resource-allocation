import ResourceAllocation from '/base-standard/ui/resource-allocation/model-resource-allocation.js';

const initialize = () => {
    const proto = Object.getPrototypeOf(ResourceAllocation);

    Object.defineProperty(proto, "settlementComparator", {
        get: function settlementComparator() {
            return this._cityComparator || ((a, b) => {
                const settlementComparison = a.settlementType.localeCompare(b.settlementType);
                if (settlementComparison !== 0) return settlementComparison;
            
                if (a.isBeingRazed && b.isBeingRazed) 
                    return Locale.compose(a.name).localeCompare(Locale.compose(b.name));
                if (a.isBeingRazed) return 1;
                if (b.isBeingRazed) return -1;
            
                const resourceCapComparison = b.resourceCap - a.resourceCap;
                if (resourceCapComparison !== 0) return resourceCapComparison;
                
                return Locale.compose(a.name).toUpperCase().localeCompare(Locale.compose(b.name).toUpperCase());
            });
        },
        set: function settlementComparator(comparator) {
            this._settlementComparator = comparator;
        }
    });

    Object.defineProperty(proto, 'resourceComparator', {
        get: function resourceComparator() {
            return this._resourceComparator || ((a, b) => {
                const typeComparison = b.classType.localeCompare(a.classType);
                return typeComparison === 0 ? a.bonus.localeCompare(b.bonus) : typeComparison;
            });
        },
        set: function resourceComparator(comparator) {
            this._resourceComparator = comparator;
        }
    });

    const update = proto.update;
    proto.update = function(...args) {
        update.apply(this, args);

        this._availableCities.sort(this.settlementComparator);
        this._availableCities.forEach(city => {
            city.currentResources.sort(this.resourceComparator);
            city.visibleResources.sort(this.resourceComparator);
            city.treasureResources.sort(this.resourceComparator);
        });
        
        this._empireResources.sort(this.resourceComparator);
        this._uniqueEmpireResources.sort(this.resourceComparator);
        this._allAvailableResources.sort(this.resourceComparator);
        this._availableBonusResources.sort(this.resourceComparator);
        this._availableResources.sort(this.resourceComparator);
        this._availableFactoryResources.sort(this.resourceComparator);
        this._treasureResources.sort(this.resourceComparator);
    }
};
engine.whenReady.then(initialize);
