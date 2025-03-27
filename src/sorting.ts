import { improveResourceSorting } from './resource-allocation/model/sorting.js'

function initialize() {
    improveResourceSorting()
}

Loading.runWhenFinished(initialize)
