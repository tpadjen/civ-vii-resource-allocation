declare var engine: {
    /**
     * Wait for the engine to be ready.
     */
    whenReady: Promise<void>

    call: (internalFunctionName: string, params: any) => void

    on: (event: GameEvent, callback: () => void) => void
    off: (event: GameEvent, callback: () => void) => void
    trigger: (event: GameEvent, params: any) => void

    reloadLocalization: () => void
    registerBindingAttribute: (
        name: string,
        callback: (element: HTMLElement, value: string) => void
    ) => void

    createJSModel: (modelName: string, model: Record<string, any>) => void
    updateWholeModel: (model: Record<string, any>) => void
}

declare var Locale: {
    compose: (text: string) => string
}

declare var GameplayMap: {
    getLocationFromIndex: (index: number) => {
        X: number
        Y: number
    }
}

declare var Game: {
    PlayerOperations: {
        canStart: (playerID: number, operation: string, args: any,
            ignoreCheck: boolean
        ) => { Success: boolean }
        sendRequest: (
            playerID: number,
            operation: string,
            args: any
        ) => void
    }
}

declare var GameContext: {
    localPlayerID: number
}

declare var PlayerOperationTypes: {
    ASSIGN_RESOURCE: string
}

declare type PlayerCities = {
    getCityIds: () => ComponentID[]
}

declare type City = {
    id: ComponentID
    isDistantLands: boolean
}

declare var Cities: {
    get: (id: ComponentID) => City | undefined
}

declare type PlayerId = number

declare var Players: {
    get: (id: PlayerId) => Player | undefined
}

declare type Player = {
    Cities: PlayerCities
}

declare type PlayerLibrary = {
    Cities: PlayerCities
}

type GameEvent =
    | 'AccountUnlinked'
    | 'AccountUpdated'
    | 'AdvancedStartCardAdded'
    | 'AdvancedStartCardRemoved'
    | 'AdvancedStartEffectUsed'
    | 'AffinityLevelChanged'
    | 'AgeProgressionChanged'
    | 'AppInForeground'
    | 'AttributeNodeCompleted'
    | 'AttributePointsChanged'
    | 'AutomationAppInitComplete'
    | 'AutomationAppUpdateComplete'
    | 'AutomationComplete'
    | 'AutomationGameStarted'
    | 'AutomationMainMenuStarted'
    | 'AutomationPostGameInitialization'
    | 'AutomationRunTest'
    | 'AutomationStart'
    | 'AutomationStopTest'
    | 'AutomationTestComplete'
    | 'Automation-Test-End'
    | 'AutomationTestFailed'
    | 'Automation-Test-LoadGame'
    | 'Automation-Test-LoadGameFixedXR'
    | 'Automation-Test-LoopTests'
    | 'Automation-Test-MenuBenchmark'
    | 'Automation-Test-Multiplayer-Host'
    | 'Automation-Test-Multiplayer-Join'
    | 'AutomationTestPassed'
    | 'Automation-Test-PauseGame'
    | 'Automation-Test-PlayGame'
    | 'Automation-Test-PlayGameFixed'
    | 'Automation-Test-PlayGameFixedMR'
    | 'Automation-Test-Production'
    | 'Automation-Test-QuitApp'
    | 'Automation-Test-QuitGame'
    | 'Automation-Test-SaveRuntimeDatabase'
    | 'Automation-Test-Transition'
    | 'Automation-Test-UI'
    | 'Automation-Test-XRScreenshotAllSeurats'
    | 'Automation-Test-XRTeleportZones'
    | 'AutomationUnpaused'
    | 'AutoplayEnded'
    | 'AutoplayStarted'
    | 'BeforeUnload'
    | 'BeginFrame'
    | 'BeliefAdded'
    | 'BenchCooled'
    | 'BenchEnded'
    | 'BenchStarted'
    | 'BenchSwapped'
    | 'BenchTerminated'
    | 'BenchUpdated'
    | 'BenchWarmed'
    | 'CameraChanged'
    | 'CapitalCityChanged'
    | 'ChallengeCompleted'
    | 'ChildNoPermissionDialog'
    | 'CityAddedToMap'
    | 'CityGovernmentLevelChanged'
    | 'CityGrowthModeChanged'
    | 'CityInitialized'
    | 'CityNameChanged'
    | 'CityPopulationChanged'
    | 'CityProductionChanged'
    | 'CityProductionCompleted'
    | 'CityProductionQueueChanged'
    | 'CityProductionUpdated'
    | 'CityProjectCompleted'
    | 'CityReligionChanged'
    | 'CityRemovedFromMap'
    | 'CitySelectionChanged'
    | 'CityStateBonusChosen'
    | 'CityTransfered'
    | 'CityYieldChanged'
    | 'CityYieldGranted'
    | 'Combat'
    | 'ConnectionStatusChanged'
    | 'ConqueredSettlementIntegrated'
    | 'ConstructibleAddedToMap'
    | 'ConstructibleChanged'
    | 'ConstructibleRemovedFromMap'
    | 'ConstructibleVisibilityChanged'
    | 'COPPACheckComplete'
    | 'CultureNodeCompleted'
    | 'CultureTreeChanged'
    | 'CultureYieldChanged'
    | 'DebugWidgetUpdated'
    | 'DiplomacyDeclareWar'
    | 'DiplomacyEventCanceled'
    | 'DiplomacyEventEnded'
    | 'DiplomacyEventResponse'
    | 'DiplomacyEventStarted'
    | 'DiplomacyEventSupportChanged'
    | 'DiplomacyGlobalTokensChanged'
    | 'DiplomacyMakePeace'
    | 'DiplomacyMeet'
    | 'DiplomacyMeetMajors'
    | 'DiplomacyQueueChanged'
    | 'DiplomacyRelationshipChanged'
    | 'DiplomacyRelationshipLevelChanged'
    | 'DiplomacyRelationshipStatusChanged'
    | 'DiplomacySessionClosed'
    | 'DiplomacyStatement'
    | 'DiplomacyTreasuryChanged'
    | 'DistrictAddedToMap'
    | 'DistrictControlChanged'
    | 'DistrictDamageChanged'
    | 'DistrictRemovedFromMap'
    | 'DNAErrorOccurred'
    | 'DNALeaderboardFetched'
    | 'DNAUserProfileCacheReady'
    | 'EntitlementsUpdated'
    | 'error_generic_EXAMPLE'
    | 'error_search_is_taking_a_long_time_EXAMPLE'
    | 'error_unplugged_network_cable_EXAMPLE'
    | 'ExitToMainMenu'
    | 'FileListQueryResults'
    | 'FinishedGameplayContentChange'
    | 'FoodQueueChanged'
    | 'ForegroundCameraAnimationComplete'
    | 'FriendListUpdated'
    | 'FriendSearchResultsUpdated'
    | 'GameAgeEnded'
    | 'GameCoreEventPlaybackComplete'
    | 'GameQueryResult'
    | 'GameStarted'
    | 'GenerateAgeTransition'
    | 'GenerateMap'
    | 'GoodyHutReward'
    | 'GraphicsOptionsChanged'
    | 'GreatWorkArchived'
    | 'GreatWorkCreated'
    | 'GreatWorkMoved'
    | 'IMECanceled'
    | 'IMEValidated'
    | 'InitialScriptAdded'
    | 'InputAction'
    | 'InputActionBinded'
    | 'InputContextChanged'
    | 'InputGestureRecorded'
    | 'InputPreferencesLoaded'
    | 'input-source-changed'
    | 'InviteAccepted'
    | 'KickDirectComplete'
    | 'KickVoteComplete'
    | 'KickVoteStarted'
    | 'LaunchToHostMPGame'
    | 'LaunchToLoadLastSaveGame'
    | 'LegacyPathMilestoneCompleted'
    | 'LegalDocumentAcceptedResult'
    | 'LegalDocumentContentReceived'
    | 'LegendPathsDataUpdated'
    | 'LiveEventActiveUpdated'
    | 'LiveEventsSettingsChanged'
    | 'LoadComplete'
    | 'LobbyShutdownComplete'
    | 'LocalPlayerChanged'
    | 'LocalPlayerTurnBegin'
    | 'LocalPlayerTurnEnd'
    | 'LogoutCompleted'
    | 'ModelTrigger'
    | 'MotDCompleted'
    | 'MultiplayerChat'
    | 'MultiplayerGameAbandoned'
    | 'MultiplayerGameLastPlayer'
    | 'MultiplayerGameListClear'
    | 'MultiplayerGameListComplete'
    | 'MultiplayerGameListError'
    | 'MultiplayerGameListUpdated'
    | 'MultiplayerHostMigrated'
    | 'MultiplayerJoinGameComplete'
    | 'MultiplayerJoinRoomAttempt'
    | 'MultiplayerJoinRoomFailed'
    | 'MultiplayerLobbyCreated'
    | 'MultiplayerLobbyError'
    | 'MultiplayerPlayerConnected'
    | 'MultiplayerPostPlayerDisconnected'
    | 'NarrativeQuestCompleted'
    | 'NarrativeQuestUpdated'
    | 'NaturalWonderRevealed'
    | 'NetworkDisconnected'
    | 'NetworkReconnected'
    | 'NotificationActivated'
    | 'NotificationAdded'
    | 'NotificationDismissed'
    | 'NotificationListUpdated'
    | 'OnContextManagerClose'
    | 'OnContextManagerOpen'
    | 'open-civilopedia'
    | 'open-screenshot-view'
    | 'open-tutorial-inspector'
    | 'OwnershipAuthorizationChanged'
    | 'PantheonFounded'
    | 'PlayerAgeTransitionComplete'
    | 'PlayerDefeat'
    | 'PlayerInfoChanged'
    | 'PlayerKicked'
    | 'PlayerProfileChanged'
    | 'PlayerSettlementCapChanged'
    | 'PlayerStartReadyChanged'
    | 'PlayerTurnActivated'
    | 'PlayerTurnDeactivated'
    | 'PlayerUnlockChanged'
    | 'PlayerUnlockProgressChanged'
    | 'PlayerYieldChanged'
    | 'PlayerYieldGranted'
    | 'PlotChanged'
    | 'plotCursorMode'
    | 'PlotEffectAddedToMap'
    | 'PlotEffectRemovedFromMap'
    | 'PlotOwnershipChanged'
    | 'PlotVisibilityChanged'
    | 'PlotYieldChanged'
    | 'PremiumServiceCheckComplete'
    | 'previous-select'
    | 'PromoRefresh'
    | 'PromosRetrievalCompleted'
    | 'QrAccountLinked'
    | 'QueryComplete'
    | 'RandomEventOccurred'
    | 'RecentlyMetPlayerListUpdated'
    | 'RedeemCodeEventUpdate'
    | 'ReligionFounded'
    | 'RemotePlayerTurnBegin'
    | 'RemotePlayerTurnEnd'
    | 'RemoveComplete'
    | 'RequestAgeInitializationParameters'
    | 'RequestConfirmHostMPGame'
    | 'RequestMapInitData'
    | 'ResourceAddedToMap'
    | 'ResourceAssigned'
    | 'ResourceCapChanged'
    | 'ResourceRemovedFromMap'
    | 'ResourceUnassigned'
    | 'RouteAddedToMap'
    | 'RuralReligionChanged'
    | 'SaveComplete'
    | 'ScienceYieldChanged'
    | 'ShowInvitePopup'
    | 'SocialOnFriendRequestReceived'
    | 'SocialOnFriendRequestSent'
    | 'SocialOnOnlineSaveDataLoaded'
    | 'SPoPComplete'
    | 'SPoPHeartbeatReceived'
    | 'SPoPKickPromptCheck'
    | 'staging-mute-changed'
    | 'StartGameSection'
    | 'StartSaveRequest'
    | 'TeamVictory'
    | 'TechNodeCompleted'
    | 'TechTreeChanged'
    | 'ToggleMouseEmulate'
    | 'TradeRouteAddedToMap'
    | 'TradeRouteChanged'
    | 'TradeRouteRemovedFromMap'
    | 'TraditionChanged'
    | 'TraditionSlotsAdded'
    | 'TreasuryChanged'
    | 'TurnBegin'
    | 'TurnEnd'
    | 'TurnTimerUpdated'
    | 'UIFontScaleChanged'
    | 'UIGameLoadingProgressChanged'
    | 'UIGlobalScaleChanged'
    | 'UnitAddedToArmy'
    | 'UnitAddedToMap'
    | 'UnitBermudaTeleported'
    | 'UnitDamageChanged'
    | 'UnitExperienceChanged'
    | 'UnitMoveComplete'
    | 'UnitMoved'
    | 'UnitMovementPointsChanged'
    | 'UnitOperationAdded'
    | 'UnitOperationDeactivated'
    | 'UnitOperationsCleared'
    | 'UnitOperationSegmentComplete'
    | 'UnitPromoted'
    | 'UnitRemovedFromArmy'
    | 'UnitRemovedFromMap'
    | 'UnitSelectionChanged'
    | 'UnitVisibilityChanged'
    | 'UpdateFrame'
    | 'update-tutorial-level'
    | 'UrbanReligionChanged'
    | 'UserGeneratedTextUpdated'
    | 'UserInfoUpdated'
    | 'UserProfilesUpdated'
    | 'UserRequestClose'
    | 'VPChanged'
    | 'WonderCompleted'
    | 'WorkerAdded'
    | 'WorldTextMessage'
    | 'XRTeleportCompleted'
