import { MBeaconEventContent, MBeaconInfoContent, MBeaconInfoEventContent } from "./@types/beacon";
import { MsgType } from "./@types/event";
import { LocationAssetType, LocationEventWireContent, MLocationEventContent, MLocationContent, LegacyLocationEventContent } from "./@types/location";
import { MRoomTopicEventContent } from "./@types/topic";
/**
 * Generates the content for a HTML Message event
 * @param {string} body the plaintext body of the message
 * @param {string} htmlBody the HTML representation of the message
 * @returns {{msgtype: string, format: string, body: string, formatted_body: string}}
 */
export declare function makeHtmlMessage(body: string, htmlBody: string): {
    msgtype: MsgType;
    format: string;
    body: string;
    formatted_body: string;
};
/**
 * Generates the content for a HTML Notice event
 * @param {string} body the plaintext body of the notice
 * @param {string} htmlBody the HTML representation of the notice
 * @returns {{msgtype: string, format: string, body: string, formatted_body: string}}
 */
export declare function makeHtmlNotice(body: string, htmlBody: string): {
    msgtype: MsgType;
    format: string;
    body: string;
    formatted_body: string;
};
/**
 * Generates the content for a HTML Emote event
 * @param {string} body the plaintext body of the emote
 * @param {string} htmlBody the HTML representation of the emote
 * @returns {{msgtype: string, format: string, body: string, formatted_body: string}}
 */
export declare function makeHtmlEmote(body: string, htmlBody: string): {
    msgtype: MsgType;
    format: string;
    body: string;
    formatted_body: string;
};
/**
 * Generates the content for a Plaintext Message event
 * @param {string} body the plaintext body of the emote
 * @returns {{msgtype: string, body: string}}
 */
export declare function makeTextMessage(body: string): {
    msgtype: MsgType;
    body: string;
};
/**
 * Generates the content for a Plaintext Notice event
 * @param {string} body the plaintext body of the notice
 * @returns {{msgtype: string, body: string}}
 */
export declare function makeNotice(body: string): {
    msgtype: MsgType;
    body: string;
};
/**
 * Generates the content for a Plaintext Emote event
 * @param {string} body the plaintext body of the emote
 * @returns {{msgtype: string, body: string}}
 */
export declare function makeEmoteMessage(body: string): {
    msgtype: MsgType;
    body: string;
};
/** Location content helpers */
export declare const getTextForLocationEvent: (uri: string, assetType: LocationAssetType, timestamp: number, description?: string) => string;
/**
 * Generates the content for a Location event
 * @param uri a geo:// uri for the location
 * @param ts the timestamp when the location was correct (milliseconds since
 *           the UNIX epoch)
 * @param description the (optional) label for this location on the map
 * @param asset_type the (optional) asset type of this location e.g. "m.self"
 * @param text optional. A text for the location
 */
export declare const makeLocationContent: (text: string | undefined, uri: string, timestamp?: number, description?: string, assetType?: LocationAssetType) => LegacyLocationEventContent & MLocationEventContent;
/**
 * Parse location event content and transform to
 * a backwards compatible modern m.location event format
 */
export declare const parseLocationEvent: (wireEventContent: LocationEventWireContent) => MLocationEventContent;
/**
 * Topic event helpers
 */
export declare type MakeTopicContent = (topic: string, htmlTopic?: string) => MRoomTopicEventContent;
export declare const makeTopicContent: MakeTopicContent;
export declare type TopicState = {
    text: string;
    html?: string;
};
export declare const parseTopicContent: (content: MRoomTopicEventContent) => TopicState;
/**
 * Beacon event helpers
 */
export declare type MakeBeaconInfoContent = (timeout: number, isLive?: boolean, description?: string, assetType?: LocationAssetType, timestamp?: number) => MBeaconInfoEventContent;
export declare const makeBeaconInfoContent: MakeBeaconInfoContent;
export declare type BeaconInfoState = MBeaconInfoContent & {
    assetType: LocationAssetType;
    timestamp: number;
};
/**
 * Flatten beacon info event content
 */
export declare const parseBeaconInfoContent: (content: MBeaconInfoEventContent) => BeaconInfoState;
export declare type MakeBeaconContent = (uri: string, timestamp: number, beaconInfoEventId: string, description?: string) => MBeaconEventContent;
export declare const makeBeaconContent: MakeBeaconContent;
export declare type BeaconLocationState = MLocationContent & {
    timestamp: number;
};
export declare const parseBeaconContent: (content: MBeaconEventContent) => BeaconLocationState;
//# sourceMappingURL=content-helpers.d.ts.map