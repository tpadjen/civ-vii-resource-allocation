export const AllResourcesUnassignedEventName = "all-resources-unassigned";

export class AllResourcesUnassignedEvent extends CustomEvent {
	constructor() {
		super(AllResourcesUnassignedEventName, { bubbles: true });
	}
}