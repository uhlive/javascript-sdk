# Releases Notes

## 0.15.1 - 2021-11-05

-   Add a `visibility` attribute to the generated API reference documentation.

## 0.15.0 - 2021-10-28

-   Add support for the following entities: `BusinessOrganization`, `BusinessProduct`, `PersBirthdate`, `QuantityMisc`, `QuantityMoney`, `TimeDate`, `TimeHour`, `TimeMisc`.

## 0.14.1 - 2021-07-01

-   Add JSDoc to `onEntityRelationFound` method.

## 0.14.0 - 2021-07-01

-   Add support for `RelationCreditCard` and `RelationLocation` events. Relation events group entities.

## 0.13.1 - 2021-06-10

-   Update the documentation generator.
-   Update outdated dependencies.

## 0.13.0 - 2021-05-25

-   Fixed a bug with a regex replacing entities globally, and not only where is was supposed to do it.
-   Added property `country` to the Uhlive constructor, which is used to format some entities. It will try to get the information from your browser and fallback to `us`.
-   The `model` property will now try to get the information from your browser and fallback to `en`.
-   The `onWordsDecoded`, `onSegmentDecoded` and `onEntityFound` events have the new `country` property to reflect which country formatting rules are used.

## 0.12.0 - 2021-03-29

### Added

-   Added support for event `EntityEvent.LocationCountry`, which is triggered when a country is detected in the transcript.
-   Added a confidence score property for the entities (`Entity.confidence`).

## 0.11.0 - 2021-03-16

### Added

-   It is now possible to listen to all `EntityFound` events at once with the `Conversation.onEntityFound("*", () => ...)` method.

## 0.10.1 - 2021-03-10

### Added

-   Added missing enums `Conversation.DecodingEvent` and `Conversation.EntityEvent`.
-   Added missing types for TypeScript users (`Conversation.EntityAnnotation`, `Conversation.SpeakerJoined`, `Conversation.SpeakerLeft`).

## 0.10.0 - 2021-03-04

### BREAKING CHANGE

-   `Conversation.onSpeakerLeft`'s callback now have as parameter a `SpeakerLeft` object instead of the speaker id (`string`).
-   Some types have changed: `ConversationEvent` is removed in favor of `DecodingEvent` and `EntityEvent` to separate NER events for the others. `EntityNumber` and `EntityOrdinal` are replaced by `Entity`, since all entities have the same signature.
-   Event listeners `Conversation.onNumberFound` and `Conversation.onOrdinalFound` have been replaced by the more generic `Conversation.onEntityFound`, the first parameter being the entity we want to listen to.

### Added

-   Support `speaker_joined` event ([see documentation](../../javascript/api-reference/classes/conversation/#onspeakerjoined)).
-   Support for Named Entity Recognition (NER) events ([see documentation](../../protocol/enrich/#enrich-events)).

### Updated

-   Add `timestamp` property to speaker_left` event ([see documentation](../../javascript/api-reference/interfaces/speakerleft/#timestamp)).
-   Add `origin` parameter to `join` method ([see documentation](../../javascript/api-reference/interfaces/conversationoptions/#origin)).

## 0.9.0 - 2021-02-01

### BREAKING CHANGE

-   The default model is now `en` instead of `default`, which was a model in French language. If you want to use a French model, please use `fr`. You can see the list of available models [here](), and how to set a different model [here]().

### Added

-   The library is now plug-and-play with very minimal configuration. Setup your identifier and token, and _voilà_, the transcription is automatically shown in a html tag. [See more in the documentation](../getting-started/).

### Updated

-   Improve documentation and returned types.

## 0.8.2 - 2021-01-21

### Updated

-   Improve documentation

## 0.8.1 - 2021-01-20

### Updated

-   Fix: Enrich events: `onEntityNumberFound` and `onEntityOrdinalFound` return the conversation.

## 0.8.0 - 2021-01-11

### Added

-   Support new "enrich" events: `onEntityNumberFound` and `onEntityOrdinalFound`.

### Updated

-   `onError` new reports more information to help debug the error.

## 0.7.0 - 2020-09-25

### Added

-   When joining a converation, there is now three new possible parameters: `model`, `interim_results`, and `rescoring`.

## 0.6.0 - 2020-09-25

### Updated

-   Improve security, you now need to configure the `identifier` parameter be identified.

## 0.5.0 - 2020-09-17

### Updated

-   The SDK starts to stream the audio as soon as the user join a conversation in non-readonly mode
-   Update NPM dependencies
-   Better management of version numbers

### Removed

-   Methods `Uhlive.startRecording`, `Uhlive.stopRecording`, `Uhlive.stopAllRecordings`, `Conversation.startRecording`, and `Conversation.stopRecording` have been removed since this in now done automaticaly when joining/leaving a conversation

## 0.4.0 - 2020-08-28

### Added

-   Display logs in the example

### Updated

-   Improve UX/UI of example
-   Update outdated npm dependencies

## 0.3.0 - 2020-08-13

### Added

-   Support the new event `speakerLeft`.

### Removed

-   Remove support for previous `transcript` event in favor of `wordsDecoded` and `segmentDecoded` events.
