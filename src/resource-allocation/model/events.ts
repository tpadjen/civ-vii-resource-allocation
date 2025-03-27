export const AllResourcesUnassignedEventName = 'all-resources-unassigned'

export class AllResourcesUnassignedEvent extends CustomEvent<void> {
    constructor() {
        super(AllResourcesUnassignedEventName, { bubbles: true })
    }
}
