/**
 * model-resource-allocation.ts
 * @copyright 2022-2023, Firaxis Games
 * @description Resource Allocation data model
 */
import CityYields from '/base-standard/ui/utilities/utilities-city-yields.js';
import ActionHandler from '/core/ui/input/action-handler.js';
import { ComponentID } from '/core/ui/utilities/utilities-component-id.js';
import UpdateGate from '/core/ui/utilities/utilities-update-gate.js';
import { localizeAndCompare } from '/base-standard/ui/resource-allocation/utilities.js';
class ResourceAllocationModel {
    constructor() {
        this._selectedResource = -1;
        this._hasSelectedAssignedResource = false;
        this._selectedResourceClass = null;
        this.selectedCityID = ComponentID.getInvalidID();
        // All resource definitions for this player keyed by resource location value
        this.allResources = new Map();
        this.isAllResourcesInit = false;
        // All queued resources values mapped to the city ComponentID they should be applied to
        this.queuedResources = new Map();
        this._latestResource = null;
        this._empireResources = [];
        this._uniqueEmpireResources = [];
        this._allAvailableResources = [];
        this._availableBonusResources = [];
        this._availableResources = [];
        this._availableFactoryResources = [];
        this._treasureResources = [];
        this._availableCities = [];
        this._selectedCityResources = null;
        this.shouldShowSelectedCityResources = false;
        this.shouldShowEmpireResourcesDetailed = false;
        this.shouldShowAvailableResources = true;
        this._isResourceAssignmentLocked = false;
        this.updateGate = new UpdateGate(() => { this.update(); });
        this.updateGate.call('constructor');
        engine.on('ResourceAssigned', this.onResourceAssigned, this);
        engine.on('ResourceUnassigned', this.onResourceUnassigned, this);
        engine.on('ResourceCapChanged', this.onResourceCapChanged, this);
        engine.on('TradeRouteAddedToMap', this.onTradeRouteAddedToMap, this);
    }
    set updateCallback(callback) {
        this.onUpdate = callback;
    }
    get playerId() {
        return GameContext.localPlayerID;
    }
    get empireResources() {
        return this._empireResources;
    }
    get uniqueEmpireResources() {
        return this._uniqueEmpireResources;
    }
    get allAvailableResources() {
        return this._allAvailableResources;
    }
    get availableResources() {
        return this._availableResources.sort(this.resourceComparator);
    }
    get availableBonusResources() {
        return this._availableBonusResources.sort(this.resourceComparator);
    }
    get availableFactoryResources() {
        return this._availableFactoryResources.sort(this.resourceComparator);
    }
    get treasureResources() {
        return this._treasureResources;
    }
    get availableCities() {
        return this._availableCities.sort(this.cityComparator);
    }
    get selectedCityResources() {
        return this._selectedCityResources;
    }
    get latestResource() {
        return this._latestResource;
    }
    get selectedResource() {
        return this._selectedResource;
    }
    get hasSelectedAssignedResource() {
        return this._hasSelectedAssignedResource;
    }
    get showUnassignResourceSlot() {
        return this._hasSelectedAssignedResource && !ActionHandler.isGamepadActive;
    }
    get selectedResourceClass() {
        return this._selectedResourceClass;
    }
    get isResourceAssignmentLocked() {
        return this._isResourceAssignmentLocked;
    }
    get assignedResources() {
        return this._availableCities.flatMap((city) => city.currentResources);
    }
    get hasAnyResourceAssigned() {
        return this.assignedResources.length > 0;
    }
    get cityComparator() {
        return this._cityComparator || ((a, b) => {
            const settlementComparison = a.settlementType.localeCompare(b.settlementType);
            if (settlementComparison !== 0) return settlementComparison;
        
            if (a.isBeingRazed && b.isBeingRazed) return localizeAndCompare(a.name, b.name);
            if (a.isBeingRazed) return 1;
            if (b.isBeingRazed) return -1;
        
            const resourceCapComparison = b.resourceCap - a.resourceCap;
            if (resourceCapComparison !== 0) return resourceCapComparison;
            
            return localizeAndCompare(a.name, b.name);
        });
    }
    set cityComparator(comparator) {
        this._cityComparator = comparator;
    }
    hasSelectedResource() {
        return (this._selectedResource != -1);
    }
    hasQueuedResources() {
        return (this.queuedResources.size > 0);
    }
    resourceComparator(a, b) {
        const typeComparison = b.classType.localeCompare(a.classType);
        return typeComparison === 0 ? a.bonus.localeCompare(b.bonus) : typeComparison;
    }
    update() {
        // If the game is in an environment where the player cannot interact (e.g., auto-play); early out.
        if ((GameContext.localObserverID == PlayerIds.NO_PLAYER) || (GameContext.localObserverID == PlayerIds.OBSERVER_ID) || Autoplay.isActive) {
            return;
        }
        this._empireResources = [];
        this._uniqueEmpireResources = [];
        this._allAvailableResources = [];
        this._availableBonusResources = [];
        this._availableResources = [];
        this._availableFactoryResources = [];
        this._treasureResources = [];
        this._availableCities = [];
        const localPlayerID = GameContext.localPlayerID;
        const localPlayer = Players.get(localPlayerID);
        if (!localPlayer) {
            console.error(`model-resource-allocation: Failed to retrieve PlayerLibrary for Player ${localPlayerID}`);
            return;
        }
        const playerResources = localPlayer.Resources;
        if (!playerResources) {
            console.error(`model-resource-allocation: Failed to retrieve Resources for Player ${localPlayerID}`);
            return;
        }
        this._isResourceAssignmentLocked = playerResources.isRessourceAssignmentLocked();
        // Look up and cache resource definitions
        let nextAllResources = playerResources.getResources().map((resource) => {
            const resourceDefinition = GameInfo.Resources.lookup(resource.uniqueResource.resource);
            if (resourceDefinition) {
                return [resource.value, resourceDefinition];
            }
            else {
                console.error(`model-resource-allocation: Failed to find resource definition for location ${resource.value}`);
                return;
            }
        });
        nextAllResources = nextAllResources.filter(resource => !!resource);
        const addedResources = nextAllResources.filter(([value = 0, _resource = {}]) => !this.allResources.has(value));
        const removedResources = Array.from(this.allResources).filter(([value, _resource]) => !nextAllResources.find(resource => resource?.[0] == value));
        this.allResources.clear();
        // change the latest resource only if we have initialized the allResources, and that a resource was added or the current latest was removed
        if (this.isAllResourcesInit && (addedResources.length || removedResources.length && removedResources.pop()?.[0] == this.latestResource?.value)) {
            const [latestResourceValue = 0, { BonusResourceSlots = 0, ResourceType = "", Name = "", Tooltip = "" } = {}] = addedResources.pop() ?? [];
            this._latestResource = {
                selected: latestResourceValue == this._selectedResource,
                disabled: false,
                queued: false,
                bonusResourceSlots: BonusResourceSlots,
                type: ResourceType,
                classType: "",
                classTypeIcon: "",
                name: Name,
                origin: "",
                bonus: Tooltip,
                value: latestResourceValue,
                count: 1,
                isInTradeNetwork: true,
                isBeingRazed: false
            };
        }
        nextAllResources.forEach(resource => this.allResources.set(resource[0], resource[1]));
        this.isAllResourcesInit = true;
        const playerCities = localPlayer.Cities;
        if (!playerCities) {
            console.error(`model-resource-allocation: Failed to retrieve Cities for Player ${localPlayerID}`);
            return;
        }
        playerCities.getCityIds().forEach((cityID) => {
            const city = Cities.get(cityID);
            if (city) {
                const cityResources = city.Resources;
                const cityTrade = city.Trade;
                if (cityResources && cityTrade) {
                    const currentResources = [];
                    const visibleResources = [];
                    const treasureResources = [];
                    const factoryResources = [];
                    if (city.Resources) {
                        city.Resources.getAssignedResources().forEach((resource) => {
                            const resourceDefinition = this.allResources.get(resource.value);
                            // Count the number of repeated resources per settlement
                            let resourceCount = 0;
                            city.Resources?.getAssignedResources().forEach((resourceToCount) => {
                                const resourceToCountDefinition = this.allResources.get(resourceToCount.value);
                                if (resourceToCountDefinition) {
                                    if (resourceToCountDefinition?.Name === resourceDefinition?.Name) {
                                        resourceCount++;
                                    }
                                }
                            });
                            // Push all resources into the currentResources array, since this array is used for other resource logic
                            if (resourceDefinition) {
                                const originCityID = Game.Resources.getOriginCity(resource.value);
                                const originCity = Cities.get(originCityID);
                                const isInTradeNetwork = this.inNetwork(localPlayerID, city);
                                let tooltipText = "";
                                if (originCity?.name) {
                                    tooltipText = Locale.stylize("{1_Name: upper}[N]{2_Tooltip}[N]{3_Origin}[N][STYLE: text-negative]{4_Trade: upper}[/STYLE]", resourceDefinition.Name, resourceDefinition.Tooltip, Locale.compose("LOC_UI_RESOURCE_ORIGIN", originCity?.name), isInTradeNetwork ? "" : "LOC_UI_RESOURCE_ALLOCATION_SETTLEMENT_DISCONNECTED");
                                }
                                else {
                                    tooltipText = Locale.stylize("{1_Name: upper}[N]{2_Tooltip}", resourceDefinition.Name, resourceDefinition.Tooltip);
                                }
                                currentResources.push({
                                    selected: resource.value == this._selectedResource
                                        && isInTradeNetwork
                                        && !this._isResourceAssignmentLocked
                                        && !city.isBeingRazed,
                                    disabled: !!this.selectedResourceClass && resource.value != this.selectedResource,
                                    queued: false,
                                    bonusResourceSlots: resourceDefinition.BonusResourceSlots,
                                    type: resourceDefinition.ResourceType,
                                    name: resourceDefinition.Name,
                                    classType: resourceDefinition.ResourceClassType,
                                    classTypeIcon: this.getResourceClassIcon(resourceDefinition.ResourceClassType),
                                    origin: originCity?.name ?? "",
                                    bonus: tooltipText,
                                    value: resource.value,
                                    count: resourceCount,
                                    isInTradeNetwork: isInTradeNetwork,
                                    isBeingRazed: city.isBeingRazed
                                });
                                // Modern Age Resources
                                // Factory Resources are assigned to its own array, and the rest are assigned to visibleResources.
                                // Push a single resource entry because a count will be displayed if it repeats.
                                if (Game.age == Game.getHash("AGE_MODERN")) {
                                    if (resourceDefinition.ResourceClassType == "RESOURCECLASS_FACTORY") {
                                        if (!factoryResources.some(resourceToFind => resourceToFind.type === resourceDefinition.ResourceType)) {
                                            {
                                                factoryResources.push({
                                                    selected: resource.value == this._selectedResource
                                                        && isInTradeNetwork
                                                        && !this._isResourceAssignmentLocked
                                                        && !city.isBeingRazed,
                                                    disabled: !!this.selectedResourceClass && resource.value != this.selectedResource,
                                                    queued: false,
                                                    bonusResourceSlots: resourceDefinition.BonusResourceSlots,
                                                    type: resourceDefinition.ResourceType,
                                                    name: resourceDefinition.Name,
                                                    classType: resourceDefinition.ResourceClassType,
                                                    classTypeIcon: this.getResourceClassIcon(resourceDefinition.ResourceClassType),
                                                    origin: originCity?.name ?? "",
                                                    bonus: tooltipText,
                                                    value: resource.value,
                                                    count: resourceCount,
                                                    isInTradeNetwork: isInTradeNetwork,
                                                    isBeingRazed: city.isBeingRazed
                                                });
                                            }
                                        }
                                    }
                                    else if (!visibleResources.some(resourceToFind => resourceToFind.type === resourceDefinition.ResourceType)) {
                                        visibleResources.push({
                                            selected: resource.value == this._selectedResource
                                                && isInTradeNetwork
                                                && !this._isResourceAssignmentLocked
                                                && !city.isBeingRazed,
                                            disabled: !!this.selectedResourceClass && resource.value != this.selectedResource,
                                            queued: false,
                                            bonusResourceSlots: resourceDefinition.BonusResourceSlots,
                                            type: resourceDefinition.ResourceType,
                                            name: resourceDefinition.Name,
                                            classType: resourceDefinition.ResourceClassType,
                                            classTypeIcon: this.getResourceClassIcon(resourceDefinition.ResourceClassType),
                                            origin: originCity?.name ?? "",
                                            bonus: tooltipText,
                                            value: resource.value,
                                            count: resourceCount,
                                            isInTradeNetwork: isInTradeNetwork,
                                            isBeingRazed: city.isBeingRazed
                                        });
                                    }
                                }
                                // Antiquity Age Resources
                                else {
                                    // Push a single resource entry to the visibleResources array so they don't repeat.
                                    // Don't add resources to the array if they're already in the Factory Resources.
                                    // This is the array that will be shown to the player
                                    if (!visibleResources.some(resourceToFind => resourceToFind.type === resourceDefinition.ResourceType)) {
                                        visibleResources.push({
                                            selected: resource.value == this._selectedResource
                                                && isInTradeNetwork
                                                && !this._isResourceAssignmentLocked
                                                && !city.isBeingRazed,
                                            disabled: !!this.selectedResourceClass && resource.value != this.selectedResource,
                                            queued: false,
                                            bonusResourceSlots: resourceDefinition.BonusResourceSlots,
                                            type: resourceDefinition.ResourceType,
                                            name: resourceDefinition.Name,
                                            classType: resourceDefinition.ResourceClassType,
                                            classTypeIcon: this.getResourceClassIcon(resourceDefinition.ResourceClassType),
                                            origin: originCity?.name ?? "",
                                            bonus: tooltipText,
                                            value: resource.value,
                                            count: resourceCount,
                                            isInTradeNetwork: isInTradeNetwork,
                                            isBeingRazed: city.isBeingRazed
                                        });
                                    }
                                }
                            }
                        });
                    }
                    const countAssignedResources = cityResources.getTotalCountAssignedResources();
                    const assignedResourcesCap = cityResources.getAssignedResourcesCap();
                    const emptySlotsNeeded = assignedResourcesCap - currentResources.length;
                    let settlementTypeString = "City";
                    let settlementAdditionalInfo = "";
                    let hasFactory = false;
                    let hasFactorySlot = false;
                    let hasTreasureResources = false;
                    let countTreasureResources = cityResources.getNumTreasureFleetResources();
                    const iGlobalTurnsUntilTreasureGenerated = cityResources.getGlobalTurnsUntilTreasureGenerated();
                    const iTurnsUntilTreasureGenerated = cityResources.getTurnsUntilTreasureGenerated();
                    const iAutoTreasureFleetValue = cityResources.getAutoTreasureFleetValue();
                    if (iAutoTreasureFleetValue > 0) {
                        countTreasureResources = iAutoTreasureFleetValue;
                        hasTreasureResources = true;
                    }
                    let uiCurrentAge = Game.age;
                    // ANTIQUITY
                    if (uiCurrentAge == Game.getHash("AGE_ANTIQUITY")) {
                        if (city.isCapital) {
                            settlementTypeString = "Capital";
                        }
                        else if (city.isTown) {
                            settlementTypeString = "Town";
                        }
                    }
                    // EXPLORATION
                    // *** EFB: temporary.  For now just append TreasureInfo on to "settlementAdditionalInfo". Very kludgy!
                    else if (uiCurrentAge == Game.getHash("AGE_EXPLORATION")) {
                        const bTreasureTechPrereqMet = cityResources.isTreasureTechPrereqMet();
                        const bTreasureConstructiblePrereqMet = cityResources.isTreasureConstructiblePrereqMet();
                        if (city.isCapital) {
                            settlementTypeString = "Capital";
                        }
                        else if (city.isTown) {
                            settlementTypeString = "Town";
                        }
                        if (city.isDistantLands) {
                            if (!bTreasureTechPrereqMet) {
                                settlementAdditionalInfo = settlementAdditionalInfo + "_Needs_Shipbuilding";
                            }
                            else if (!bTreasureConstructiblePrereqMet) {
                                settlementAdditionalInfo = settlementAdditionalInfo + "_Needs_FishingQuay";
                                // This Settlement meets the requirements.
                            }
                            else if (countTreasureResources > 0) {
                                settlementAdditionalInfo = settlementAdditionalInfo + "_" + countTreasureResources.toString() + "_VP_" + iTurnsUntilTreasureGenerated.toString() + "_Turns";
                                hasTreasureResources = true;
                                // Populate the Treasure Resources Array
                                // Find the Treasure Resources within the Local Resources
                                cityResources.getLocalResources().forEach((localResource) => {
                                    const localResourceDefinition = GameInfo.Resources.lookup(localResource.uniqueResource.resource);
                                    if (localResourceDefinition) {
                                        const tooltipText = Locale.stylize("{1_Name: upper}[N]{2_Tooltip}[N]{3_Name}", localResourceDefinition.Name, localResourceDefinition.Tooltip, Locale.compose("LOC_UI_RESOURCE_ORIGIN", city.name));
                                        if (localResourceDefinition.ResourceClassType === "RESOURCECLASS_TREASURE") {
                                            treasureResources.push({
                                                selected: false,
                                                disabled: !!this.selectedResourceClass && localResource.value != this.selectedResource,
                                                queued: false,
                                                bonusResourceSlots: 0,
                                                type: localResourceDefinition.ResourceType,
                                                name: localResourceDefinition.Name,
                                                classType: "RESOURCECLASS_TREASURE",
                                                classTypeIcon: this.getResourceClassIcon("RESOURCECLASS_TREASURE"),
                                                origin: city.name,
                                                bonus: tooltipText,
                                                value: localResource.value,
                                                count: 1,
                                                isInTradeNetwork: true,
                                                isBeingRazed: city.isBeingRazed
                                            });
                                        }
                                    }
                                });
                            }
                        }
                    }
                    // MODERN
                    // *** EFB: temporary.  For now just append RR and Factory info on to "settlementAdditionalInfo". Very kludgy!
                    else if (uiCurrentAge == Game.getHash("AGE_MODERN")) {
                        if (city.isCapital) {
                            settlementTypeString = "Capital";
                        }
                        else if (city.isTown) {
                            settlementTypeString = "Town";
                        }
                        const bTreasureConstructiblePrereqMet = cityResources.isTreasureConstructiblePrereqMet();
                        const countFactoryResources = cityResources.getNumFactoryResources();
                        const factoryResourceType = cityResources.getFactoryResource();
                        if (!bTreasureConstructiblePrereqMet) {
                            settlementAdditionalInfo = settlementAdditionalInfo + "_No_Factory";
                        }
                        else if (countFactoryResources == 0) {
                            settlementAdditionalInfo = settlementAdditionalInfo + "_Empty_Factory";
                            hasFactory = true;
                            if (emptySlotsNeeded > 0) {
                                hasFactorySlot = true;
                            }
                        }
                        else {
                            let factoryTypeString = "_UnknownFactory_";
                            const resourceInfo = GameInfo.Resources.lookup(factoryResourceType);
                            if (resourceInfo != null) {
                                factoryTypeString = "_" + Locale.compose(resourceInfo.Name) + "Factory_";
                                hasFactory = true;
                                hasFactorySlot = false;
                            }
                            settlementAdditionalInfo = settlementAdditionalInfo + factoryTypeString + countFactoryResources.toString() + "_VP";
                        }
                    }
                    // Keep an array of empty slots useful for data binding
                    // TODO 'tooltip' isn't used right now but intended to show information like warnings or details about the slot type
                    const emptySlots = [];
                    for (let i = 0; i < emptySlotsNeeded; i++) {
                        emptySlots.push({
                            tooltip: "",
                            id: city.id
                        });
                    }
                    let settlementIconString = "";
                    let settlementTypeName = "";
                    switch (settlementTypeString) {
                        case 'Capital':
                            settlementIconString = 'res_capital';
                            settlementTypeName = "LOC_CAPITAL_SELECT_PROMOTION_" + settlementTypeString.toUpperCase();
                            break;
                        case 'City':
                            settlementIconString = 'Yield_Cities';
                            settlementTypeName = "LOC_CAPITAL_SELECT_PROMOTION_" + settlementTypeString.toUpperCase();
                            break;
                        case 'Town':
                            settlementIconString = 'Yield_Towns';
                            settlementTypeName = "LOC_CAPITAL_SELECT_PROMOTION_NONE";
                            break;
                        default:
                            settlementIconString = 'Yield_Cities';
                            settlementTypeName = "LOC_CAPITAL_SELECT_PROMOTION_NONE";
                            break;
                    }
                    const yields = CityYields.getCityYieldDetails(cityID);
                    const isInTradeNetwork = this.inNetwork(localPlayerID, city);
                    const newCityEntry = {
                        name: city.name,
                        id: city.id,
                        currentResources: currentResources.sort(this.resourceComparator),
                        visibleResources: visibleResources.sort(this.resourceComparator),
                        treasureResources: treasureResources.sort(this.resourceComparator),
                        factoryResources: factoryResources.sort(this.resourceComparator),
                        queuedResources: [],
                        emptySlots: emptySlots,
                        settlementType: settlementTypeString,
                        settlementIcon: settlementIconString,
                        settlementTypeName: settlementTypeName,
                        settlementAdditionalInfo: settlementAdditionalInfo,
                        allocatedResources: countAssignedResources,
                        resourceCap: assignedResourcesCap,
                        hasTreasureResources: hasTreasureResources,
                        treasureVictoryPoints: countTreasureResources,
                        globalTurnsUntilTreasureGenerated: iGlobalTurnsUntilTreasureGenerated,
                        turnsUntilTreasureGenerated: Locale.compose("LOC_UI_RESOURCE_TREASURE_TURNS_LEFT", iTurnsUntilTreasureGenerated),
                        hasFactory: hasFactory,
                        hasFactorySlot: hasFactorySlot,
                        yields: yields,
                        isInTradeNetwork: isInTradeNetwork,
                        isBeingRazed: city.isBeingRazed
                    };
                    if (settlementTypeString == 'Capital') {
                        this._availableCities.unshift(newCityEntry);
                    }
                    else {
                        this._availableCities.push(newCityEntry);
                    }
                }
            }
        });
        this.allResources.forEach((resourceDefinition, resourceValue) => {
            // Only show resources that haven't been assigned
            for (let i = 0; i < this._availableCities.length; i++) {
                const cityEntry = this._availableCities[i];
                // Find resources that have already been assigned.
                for (let j = 0; j < cityEntry.currentResources.length; j++) {
                    if (cityEntry.currentResources[j].value == resourceValue) {
                        // This resource is already assigned to a city
                        return;
                    }
                }
            }
            const originCityID = Game.Resources.getOriginCity(resourceValue);
            const originCity = Cities.get(originCityID);
            let isInTradeNetwork = false;
            let isBeingRazed = false;
            if (originCity) {
                isInTradeNetwork = this.inNetwork(localPlayerID, originCity);
                isBeingRazed = originCity.isBeingRazed;
            }
            let tooltipText = "";
            if (originCity?.name) {
                tooltipText = Locale.stylize("{1_Name: upper} [N]{2_Tooltip}[N]{3_Origin}[N][STYLE: text-negative]{4_Trade: upper}[/STYLE]", resourceDefinition.Name, resourceDefinition.Tooltip, Locale.compose("LOC_UI_RESOURCE_ORIGIN", originCity?.name), isInTradeNetwork ? "" : "LOC_UI_RESOURCE_ALLOCATION_SETTLEMENT_DISCONNECTED");
            }
            else {
                tooltipText = Locale.stylize("{1_Name: upper}[N]{2_Tooltip}", resourceDefinition.Name, resourceDefinition.Tooltip);
            }
            const isEmpireResource = resourceDefinition.ResourceClassType == "RESOURCECLASS_EMPIRE";
            const isFactoryResource = resourceDefinition.ResourceClassType == "RESOURCECLASS_FACTORY";
            const isTreasureResource = resourceDefinition.ResourceClassType == "RESOURCECLASS_TREASURE";
            const isBonusResource = resourceDefinition.ResourceClassType == "RESOURCECLASS_BONUS";
            if (!isEmpireResource && !isTreasureResource) {
                let unassignedYieldsTooltip = "";
                GameInfo.Yields.forEach(yieldDefinition => {
                    const unassignedBonus = playerResources.getUnassignedResourceYieldBonus(Database.makeHash(yieldDefinition.YieldType));
                    if (unassignedBonus > 0) {
                        unassignedYieldsTooltip += '[N]' + Locale.compose("LOC_BUILDING_PLACEMENT_YIELD_WITH_ICON", unassignedBonus, yieldDefinition.IconString, yieldDefinition.Name);
                    }
                });
                if (unassignedYieldsTooltip != "") {
                    unassignedYieldsTooltip = Locale.compose("LOC_RESOURCE_UNASSIGNED_BONUSES") + unassignedYieldsTooltip;
                    tooltipText = tooltipText + Locale.stylize("[N]" + unassignedYieldsTooltip);
                }
            }
            const resourceEntry = {
                selected: resourceValue == this._selectedResource
                    && isInTradeNetwork
                    && !this._isResourceAssignmentLocked
                    && !isBeingRazed,
                disabled: !!this.selectedResourceClass && resourceValue != this.selectedResource,
                queued: false,
                bonusResourceSlots: resourceDefinition.BonusResourceSlots,
                type: resourceDefinition.ResourceType,
                name: resourceDefinition.Name,
                classType: resourceDefinition.ResourceClassType,
                classTypeIcon: this.getResourceClassIcon(resourceDefinition.ResourceClassType),
                origin: originCity?.name ?? "",
                bonus: tooltipText,
                value: resourceValue,
                count: 0,
                isInTradeNetwork: isInTradeNetwork,
                isBeingRazed: isBeingRazed
            };
            // Array used to determine available resource selection.
            if (!isEmpireResource) {
                this._allAvailableResources.push(resourceEntry);
            }
            // Populate the Empire Resources
            if (isEmpireResource) {
                this._empireResources.push(resourceEntry);
            }
            else if (isFactoryResource && Game.age == Game.getHash("AGE_MODERN")) {
                this._availableFactoryResources.push(resourceEntry);
            }
            else if (isTreasureResource && Game.age == Game.getHash("AGE_EXPLORATION")) {
                this._treasureResources.push(resourceEntry);
            }
            else if (isBonusResource) {
                this._availableBonusResources.push(resourceEntry);
            }
            else {
                this._availableResources.push(resourceEntry);
            }
        });
        this.setResourceCount(this._empireResources);
        this._uniqueEmpireResources = this.createUniqueResourceArray(this._empireResources);
        if (this.shouldShowSelectedCityResources && ComponentID.isValid(this.selectedCityID)) {
            const cityEntry = this._availableCities.find(entry => ComponentID.isMatch(entry.id, this.selectedCityID));
            if (cityEntry) {
                this._selectedCityResources = cityEntry;
            }
            else {
                console.error(`model-resource-allocation: Failed to find CityEntry for selectedCityResources from ${ComponentID.toString(this.selectedCityID)}`);
            }
        }
        this.determineShowAvailableResources();
        if (this.onUpdate) {
            this.onUpdate(this);
        }
    }
    setResourceCount(resourceArray) {
        for (const resource of resourceArray) {
            const count = resourceArray.filter((resourceToCount) => resourceToCount.type === resource.type);
            resource.count = count.length;
        }
    }
    createUniqueResourceArray(resourceArray) {
        const uniqueResourceArray = [];
        for (const resource of resourceArray) {
            if (!uniqueResourceArray.find(resourceToFind => resourceToFind.type === resource.type)) {
                uniqueResourceArray.push(resource);
            }
        }
        return uniqueResourceArray;
    }
    determineShowAvailableResources() {
        this.shouldShowAvailableResources =
            this.availableResources.length +
                this.availableBonusResources.length +
                this.availableFactoryResources.length
                > 0
                || this._selectedResource != -1;
    }
    clearSelectedResource() {
        this._selectedResource = -1;
        this._hasSelectedAssignedResource = false;
        this._selectedResourceClass = null;
        this.determineShowAvailableResources();
        this.updateGate.call('clearResource');
    }
    selectAvailableResource(selectedResourceValue, selectedResourceClass) {
        // Check if we have an assigned resource already selected and
        // we want to move it back to the available pool
        const returnToPool = this.selectedResource != -1 && !this._allAvailableResources.some((availableResource) => {
            return this.selectedResource == availableResource.value;
        });
        if (returnToPool) {
            this.unassignResource(this._selectedResource);
        }
        else {
            this.selectResource(selectedResourceValue, selectedResourceClass);
        }
    }
    selectAssignedResource(selectedResourceValue, selectedResourceClass) {
        this._hasSelectedAssignedResource = true;
        this.selectResource(selectedResourceValue, selectedResourceClass);
    }
    selectResource(selectedResourceValue, selectedResourceClass) {
        if (this._selectedResource == selectedResourceValue) {
            // If we select the same resource then deselect it
            this.clearSelectedResource();
        }
        else {
            this._selectedResource = selectedResourceValue;
            this._selectedResourceClass = selectedResourceClass;
        }
        this.updateGate.call('selectResource');
    }
    focusCity(selectedCityID) {
        const localPlayerID = GameContext.localPlayerID;
        const localPlayer = Players.get(localPlayerID);
        if (!localPlayer) {
            console.error(`model-resource-allocation: Failed to retrieve PlayerLibrary for Player ${localPlayerID} when selecting a city.`);
            return;
        }
        const playerCities = localPlayer.Cities;
        if (!playerCities) {
            console.error(`model-resource-allocation: Failed to retrieve Cities for Player ${localPlayerID} when selecting a city.`);
            return;
        }
        const cityID = playerCities.getCityIds().find(cityComponentID => cityComponentID.id == selectedCityID);
        if (!cityID) {
            console.error(`model-resource-allocation: Failed to find city ${selectedCityID} in playerCities.getCityIds()`);
            return;
        }
        this.selectedCityID = cityID;
        UI.Player.lookAtID(cityID);
    }
    selectCity(selectedCityID) {
        const localPlayerID = GameContext.localPlayerID;
        const localPlayer = Players.get(localPlayerID);
        if (!localPlayer) {
            console.error(`model-resource-allocation: Failed to retrieve PlayerLibrary for Player ${localPlayerID} when selecting a city.`);
            return;
        }
        const playerCities = localPlayer.Cities;
        if (!playerCities) {
            console.error(`model-resource-allocation: Failed to retrieve Cities for Player ${localPlayerID} when selecting a city.`);
            return;
        }
        const cityID = playerCities.getCityIds().find(cityComponentID => cityComponentID.id == selectedCityID);
        if (!cityID) {
            console.error(`model-resource-allocation: Failed to find city ${selectedCityID} in playerCities.getCityIds()`);
            return;
        }
        this.selectedCityID = cityID;
        UI.Player.lookAtID(cityID);
        if (this.hasSelectedResource()) {
            const location = GameplayMap.getLocationFromIndex(this._selectedResource);
            const args = { Location: location, City: cityID.id };
            const result = Game.PlayerOperations.canStart(GameContext.localPlayerID, PlayerOperationTypes.ASSIGN_RESOURCE, args, false);
            if (result.Success) {
                Game.PlayerOperations.sendRequest(GameContext.localPlayerID, PlayerOperationTypes.ASSIGN_RESOURCE, args);
            }
            this.clearSelectedResource();
        }
        this.updateGate.call('selectCity');
    }
    updateResources() {
        this.updateGate.call('updateResources');
    }
    toggleMoreInfo() {
        this.shouldShowSelectedCityResources = !this.shouldShowSelectedCityResources;
        if (this.onUpdate) {
            this.onUpdate(this);
        }
    }
    toggleEmpireResourceDetails() {
        this.shouldShowEmpireResourcesDetailed = !this.shouldShowEmpireResourcesDetailed;
        if (this.onUpdate) {
            this.onUpdate(this);
        }
    }
    canMakeResourceAssignmentRequest(cityIdData) {
        const cityEntry = this._availableCities.find(entry => entry.id.id == cityIdData);
        if (this.hasSelectedResource()) {
            const location = GameplayMap.getLocationFromIndex(this._selectedResource);
            const args = { Location: location, City: cityEntry?.id.id };
            const result = Game.PlayerOperations.canStart(GameContext.localPlayerID, PlayerOperationTypes.ASSIGN_RESOURCE, args, false);
            return result.Success;
        }
        return false;
    }
    unassignAllResources() {
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
    unassignResource(selectedResourceValue) {
        const localPlayerID = GameContext.localPlayerID;
        const localPlayer = Players.get(localPlayerID);
        if (!localPlayer) {
            console.error(`model-resource-allocation: Failed to retrieve PlayerLibrary for Player ${localPlayerID} when unassigning a resource.`);
            return;
        }
        // Find the location of the resource
        const location = GameplayMap.getLocationFromIndex(selectedResourceValue);
        // Find the city that this resource is currently assigned to
        let cityID = ComponentID.getInvalidID();
        this.availableCities.forEach((cityEntry) => {
            cityEntry.currentResources.forEach((resourceEntry) => {
                if (resourceEntry.value == selectedResourceValue) {
                    cityID = cityEntry.id;
                }
            });
        });
        if (ComponentID.isInvalid(cityID)) {
            console.error(`model-resource-allocation: Failed to retrieve City for from location of an assigned resource when unassigning a resource.`);
            return;
        }
        const args = { Location: location, City: cityID.id, Action: PlayerOperationParameters.Deactivate };
        const result = Game.PlayerOperations.canStart(localPlayer.id, PlayerOperationTypes.ASSIGN_RESOURCE, args, false);
        if (result.Success) {
            Game.PlayerOperations.sendRequest(localPlayer.id, PlayerOperationTypes.ASSIGN_RESOURCE, args);
        }
        this.clearSelectedResource();
    }
    isEntrySupportSelectingResource(entry) {
        switch (this._selectedResourceClass) {
            case "RESOURCECLASS_FACTORY":
                return entry.hasFactory;
            case "RESOURCECLASS_CITY":
                return entry.settlementType != "Town";
            default:
                return true;
        }
    }
    isCityEntryDisabled(entryEntryId) {
        const cityEntry = this._availableCities.find(entry => entry.id.id == entryEntryId);
        if (!cityEntry) {
            return true;
        }
        const isSelectedResourceAlreadyAssignedToCity = cityEntry.currentResources.some(({ value }) => value == this._selectedResource);
        const isAllocatedRessourcesFull = cityEntry.emptySlots.length == 0;
        return this.hasSelectedResource() && (isSelectedResourceAlreadyAssignedToCity || isAllocatedRessourcesFull || !this.isEntrySupportSelectingResource(cityEntry));
    }
    onResourceAssigned(_event) {
        this.updateGate.call('onResourceAssigned');
    }
    onResourceUnassigned(_event) {
        this.updateGate.call('onResourceUnassigned');
    }
    onResourceCapChanged() {
        this.updateGate.call('onResourceCapChanged');
    }
    onTradeRouteAddedToMap() {
        this.updateGate.call('onTradeRouteAddedToMap');
    }
    getResourceClassIcon(resourceType) {
        switch (resourceType) {
            case "RESOURCECLASS_FACTORY":
                return "restype_factory";
            case "RESOURCECLASS_EMPIRE":
                return "restype_empire";
            case "RESOURCECLASS_TREASURE":
                return "restype_distant";
            case "RESOURCECLASS_CITY":
                return "restype_city";
            case "RESOURCECLASS_BONUS":
                return "restype_bonus";
            case null:
            default:
                return null;
        }
    }
    inNetwork(playerID, city) {
        // If this is a foreign player, we have a trade route going to them, so automatically considered in network
        if (playerID != city.owner) {
            return true;
        }
        if (city.Trade) {
            return city.Trade.isInTradeNetwork();
        }
        return false;
    }
}
const ResourceAllocation = new ResourceAllocationModel();
engine.whenReady.then(() => {
    const updateModel = () => {
        engine.updateWholeModel(ResourceAllocation);
    };
    engine.createJSModel('g_ResourceAllocationModel', ResourceAllocation);
    ResourceAllocation.updateCallback = updateModel;
});
export { ResourceAllocation as default };

//# sourceMappingURL=file:///base-standard/ui/resource-allocation/model-resource-allocation.js.map
