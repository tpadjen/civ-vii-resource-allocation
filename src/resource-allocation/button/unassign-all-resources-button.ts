import { ExtendedResourceAllocation } from 'resource-allocation/types.js'
import { AllResourcesUnassignedEvent } from '../model/events.js'
import ActionHandler from '/core/ui/input/action-handler.js'
import Databind from '/core/ui/utilities/utilities-core-databinding.js'
import { MustGetElement } from '/core/ui/utilities/utilities-dom.js'

class UnassignAllResourcesButton extends Component {
    private unassignAllResourcesActivateListener: (event: any) => void =
        this.onUnassignAllResourcesActivate.bind(this)

    onInitialize() {
        super.onInitialize()

        const activatable = MustGetElement('.unassign-all-resources', this.Root)
        activatable.addEventListener(
            'action-activate',
            this.unassignAllResourcesActivateListener
        )

        const button = MustGetElement('.unassign-all-button', this.Root)
        Databind.classToggle(
            button,
            'hidden',
            '!{{g_ResourceAllocationModel.hasAnyResourceAssigned}} || {{g_ResourceAllocationModel.isResourceAssignmentLocked}}'
        )
    }

    private onUnassignAllResourcesActivate(event: CustomEvent<void>) {
        if (!(event.target instanceof HTMLElement)) {
            return
        }
        if (ActionHandler.isGamepadActive) {
            return
        }

        ExtendedResourceAllocation.unassignAllResources()

        this.Root.dispatchEvent(new AllResourcesUnassignedEvent())
    }
}

Controls.define('unassign-all-resources-button', {
    createInstance: UnassignAllResourcesButton as unknown as new (
        root: ComponentRoot
    ) => Component,
    description: 'Button to unassign all resources',
    styles: [
        'fs://game/tbq-resource-allocation-improvements/src/resource-allocation/button/unassign-all-resources-button.css',
    ],
    content: [
        'fs://game/tbq-resource-allocation-improvements/src/resource-allocation/button/unassign-all-resources-button.html',
    ],
})
