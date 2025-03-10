import ActionHandler from '/core/ui/input/action-handler.js';
import ResourceAllocation from '/base-standard/ui/resource-allocation/model-resource-allocation.js';
import { MustGetElement } from '/core/ui/utilities/utilities-dom.js';
import { AllResourcesUnassignedEvent } from '/mod/unassign-all/events/all-resources-unassigned.js'
import Databind from '/core/ui/utilities/utilities-core-databinding.js';

class UnassignAllResourcesButton extends Component {
    constructor() {
        super(...arguments);
        this.unassignAllResourcesActivateListener = this.onUnassignAllResourcesActivate.bind(this);
    }

    onInitialize() {
        super.onInitialize();

        const activatable = MustGetElement('.unassign-all-resources', this.Root);
        activatable.addEventListener('action-activate', this.unassignAllResourcesActivateListener);
        
        const button = MustGetElement('.unassign-all-button', this.Root);
        Databind.classToggle(
            button, 
            "hidden",
            "!{{g_ResourceAllocationModel.hasAnyResourceAssigned}} || {{g_ResourceAllocationModel.isResourceAssignmentLocked}}"
        );
    }

    onUnassignAllResourcesActivate(event) {
        if (!(event.target instanceof HTMLElement)) {
            return;
        }
        if (ActionHandler.isGamepadActive) {
            return;
        }

        ResourceAllocation.unassignAllResources();

        this.Root.dispatchEvent(new AllResourcesUnassignedEvent());
    }
}

Controls.define('unassign-all-resources-button', {
    createInstance: UnassignAllResourcesButton,
    description: 'Button to unassign all resources',
    styles: ['fs://game/tbqs-resource-allocation-improvements/mod/unassign-all/button/unassign-all-resources-button.css'],
    content: ['fs://game/tbqs-resource-allocation-improvements/mod/unassign-all/button/unassign-all-resources-button.html'],
});