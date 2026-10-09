// Persisted project mutations only. High frequency telemetry and media clocks are excluded.
export const nativeStateEvents=new Set([
 'SceneCreated','SceneRemoved','SceneNameChanged','CurrentProgramSceneChanged','CurrentPreviewSceneChanged',
 'SceneItemCreated','SceneItemRemoved','SceneItemTransformChanged','SceneItemEnableStateChanged','SceneItemLockStateChanged','SceneItemListReindexed',
 'InputCreated','InputRemoved','InputNameChanged','InputSettingsChanged','InputMuteStateChanged','InputVolumeChanged','InputAudioBalanceChanged','InputAudioSyncOffsetChanged','InputAudioTracksChanged','InputAudioMonitorTypeChanged',
 'SourceFilterCreated','SourceFilterRemoved','SourceFilterNameChanged','SourceFilterSettingsChanged','SourceFilterEnableStateChanged','SourceFilterListReindexed',
 'CurrentSceneTransitionChanged','CurrentSceneTransitionDurationChanged','ProfileChanged'
]);
export const collectionEvents=new Set(['CurrentSceneCollectionChanging','CurrentSceneCollectionChanged']);
