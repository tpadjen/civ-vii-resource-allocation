import { improveResourceAllocation } from './resource-allocation/model/resource-allocation.js'

import './resource-allocation/button/unassign-all-resources-button.js'
import './resource-allocation/screen/decorator.js'

function initialize() {
    improveResourceAllocation()
}

Loading.runWhenFinished(initialize)
