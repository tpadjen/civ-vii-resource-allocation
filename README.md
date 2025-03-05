# TBQ's Resource Allocation Improvements

A mod to improve the Resources screen in Civ VII.

## Features:
* Remove all assigned resources from all settlements with the click of a button
* Autosort Settlements
    * Capital first, then cities, finally towns
    * Within a category (city or town) sort by
        * Larger resource capacity
        * Then alphabetically by localized city name
        * Razed settlements always come last in their group 
* Keep all resource lists sorted too
* Middle click an assigned resource to immediately unassign it from a settlement, if possible


## Installation Instructions
1. You can download the latest stable release at [Civfanatics](https://forums.civfanatics.com/resources/[TODO - placeholder]/)
2. Extract to the corresponding mods folder
    * Windows: `%localappdata%\Firaxis Games\Sid Meier's Civilization VII\Mods`
    * MacOS: `~/Library/Application Support/Civilization VII/Mods`
    * Steam Deck\Linux: `~/My Games/Sid Meier's Civilization VII/Mods/`

## Known Issues
* Unassigning Resources
    * Camels are currently removed separately from other resources in a second pass during a mass unassignment because the engine refuses to remove them if there are still other resources filling the spots that were added to the city by the camel.
    * Unassigning a ton of resources may cause a short lag.