export enum DecodingEvent {
    SegmentDecoded = "SegmentDecoded",
    WordsDecoded = "WordsDecoded",
}

export enum EntityEvent {
    BusinessOrganization = "BusinessOrganization",
    BusinessProduct = "BusinessProduct",
    CreditCardExpirationDateFound = "CreditCardExpirationDateFound",
    CreditCardNumber = "CreditCardNumber",
    CreditCardVerificationValueFound = "CreditCardVerificationValueFound",
    Email = "Email",
    HealthDisease = "HealthDisease",
    HealthOrgan = "HealthOrgan",
    Iban = "Iban",
    LocationCity = "LocationCity",
    LocationCountry = "LocationCountry",
    LocationDeliveryPoint = "LocationDeliveryPoint",
    LocationMisc = "LocationMisc",
    LocationPostalCode = "LocationPostalCode",
    LocationStreet = "LocationStreet",
    Number = "Number",
    Ordinal = "Ordinal",
    PersBirthdate = "PersBirthdate",
    PersFirstname = "PersFirstname",
    PersLastname = "PersLastname",
    PersSpelledFirstname = "PersSpelledFirstname",
    PersSpelledLastname = "PersSpelledLastname",
    QuantityMisc = "QuantityMisc",
    QuantityMoney = "QuantityMoney",
    TelephoneNumber = "TelephoneNumber",
    TimeDate = "TimeDate",
    TimeHour = "TimeHour",
    TimeMisc = "TimeMisc",
}

export enum EntitiesRelationEvent {
    CreditCard = "CreditCard",
    Identity = "Identity",
    Location = "Location",
}

/**
 * Optional parameters for Conversation class constructor.
 */
export interface ConversationOptions {
    /**
     * Specify which country will be used to interpret certain entities.
     */
    country?: string;
    /**
     * Specify on which decoding events we want to unsubscribe to.
     */
    ignoreDecodingEvents?: DecodingEvent[];
    /**
     * Specify on which entity events we want to unsubscribe to.
     */
    ignoreEntities?: EntityEvent[];
    /**
     * Send interim segments as well as the final segments.
     */
    interim_results?: boolean;
    /**
     * Specify which model to use to decode the audio.
     */
    model?: string;
    /**
     * If provided, it's a Unix Timestamp in millisecond that sets the origin of time for the transcript events.
     */
    origin?: number;
    /**
     * Set to `true` if you don't want to send audio but only read. Note that in read-only mode, no events will be emitted.
     */
    readonly?: boolean;
    /**
     * Rescore the transcript result for better results.
     */
    rescoring?: boolean;
    /**
     * Speaker identifier.
     */
    speaker?: string;
    /**
     * Specify in which element the conversation should be displayed.
     */
    wrapper?: string;
}

export interface EntityAnnotationQuantity {
    unit: string;
    value: number;
}

export interface EntityAnnotation {
    /**
     * Well-formatted form of the entity, for humans.
     */
    canonical?: string;
    /**
     * The original transcript.
     */
    original: string;
    /**
     * The interpreted value, for machines.
     */
    value?: number | string | EntityAnnotationQuantity | null;
}

export interface Entity {
    /**
     * Annotation to enrich the transcript.
     */
    annotation: EntityAnnotation;
    /**
     * Confidence score between 0.0 and 1.0.
     */
    confidence: number;
    /**
     * Country where the speaker is (2 letters ISO 3166-1 code).
     */
    country: string;
    /**
     * Timestamp of the end of the entity, in milliseconds.
     */
    end: number;
    /**
     * Lang of the entity.
     */
    lang: string;
    /**
     * Length of the entity, in milliseconds.
     */
    length: number;
    /**
     * The id of the speaker.
     */
    speaker: string;
    /**
     * Timestamp of the start of the entity, in milliseconds.
     */
    start: number;
}

export interface EntityRef {
    /**
     * The entity name.
     */
    entity: string;
    /**
     * The timestamp where the referenced entity starts, in milliseconds.
     */
    start: number;
}

export interface EntityRelation {
    /**
     * The confidence score of the relation (how sure we are that they belong together), between 0 and 1.
     */
    confidence: number;
    /**
     * The timestamp where the last member in the relation ends, in milliseconds.
     */
    end: number;
    /**
     * The duration, in milliseconds.
     */
    length: number;
    /**
     * List of the reference to the entities taking part in the relation.
     */
    members: EntityRef[];
    /**
     * The id of the speaker.
     */
    speaker: string;
    /**
     * The timestamp where the first member in the relation starts, in milliseconds.
     */
    start: number;
}

/**
 * @ignore
 */
interface Decoding {
    /**
     * Confidence score between 0.0 and 1.0.
     */
    confidence: number;
    /**
     * Timestamp of the end of the word, in milliseconds.
     */
    end: number;
    /**
     * Length of the word, in milliseconds.
     */
    length: number;
    /**
     * Timestamp of the beginning of the word, in milliseconds.
     */
    start: number;
}

export interface SegmentDecodedWord extends Decoding {
    /**
     * The decoded word.
     */
    word: string;
}

export interface SpeakerJoined {
    /**
     * Are interim result activated?
     */
    interim_result: boolean;
    /**
     * Speech language.
     */
    lang: string;
    /**
     * Technical name of the ASR model.
     */
    model: string;
    /**
     * Is rescoring activated?
     */
    rescoring: boolean;
    /**
     * The start time of the audio.
     */
    timestamp: number;
}

export interface SpeakerLeft {
    /**
     * The reason for leaving.
     */
    reason: string;
    /**
     * The id of the speaker leaving the conversation.
     */
    speaker: string;
    /**
     * The actual timestamp the speaker left.
     */
    timestamp: number;
}

export interface WordsDecoded extends Decoding {
    /**
     * Country where the speaker is (2 letters ISO 3166-1 code).
     */
    country: string;
    /**
     * Speech language. 2 letter ISO code.
     */
    lang: string;
    /**
     * Technical name of ASR model. You can find the list of available models [here](https://docs.allo-media.net/live-api/asr-models/#available-asr-models).
     */
    model: string;
    /**
     * The id of the speaker.
     */
    speaker: string;
    /**
     * Concatenated words of the segment.
     */
    transcript: string;
    /**
     * Identifies the utterance this event transcribes.
     */
    utterance_id: number;
    /**
     * Words decoded for the segment.
     */
    words: SegmentDecodedWord[];
}

export interface SegmentDecoded extends Decoding {
    /**
     * Country where the speaker is (2 letters ISO 3166-1 code).
     */
    country: string;
    /**
     * Speech language. 2 letter ISO code.
     */
    lang: string;
    /**
     * Technical name of ASR model. You can find the list of available models [here](https://docs.allo-media.net/live-api/asr-models/#available-asr-models).
     */
    model: string;
    /**
     * The id of the speaker.
     */
    speaker: string;
    /**
     * Concatenated words of the segment.
     */
    transcript: string;
    /**
     * Identifies the utterance this event transcribes.
     */
    utterance_id: number;
    /**
     * Words decoded for the segment.
     */
    words: SegmentDecodedWord[];
}

export interface TagsFound {
    /**
     * Annotation to the tag.
     */
     annotation: TagAnnotation;
     /**
      * Confidence score between 0.0 and 1.0.
      */
     confidence: number;
     /**
      * Country where the speaker is (2 letters ISO 3166-1 code).
      */
     country: string;
     /**
      * Timestamp of the end of the entity, in milliseconds.
      */
     end: number;
     /**
      * Lang of the entity.
      */
     lang: string;
     /**
      * Length of the entity, in milliseconds.
      */
     length: number;
     /**
      * The id of the speaker.
      */
     speaker: string;
     /**
      * Timestamp of the start of the entity, in milliseconds.
      */
     start: number;
}

export interface TagAnnotation {
    tags: Tag[];
}

export interface Tag {
    label: string;
    uuid: string;
}
