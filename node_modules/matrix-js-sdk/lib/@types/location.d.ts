import { EitherAnd } from "matrix-events-sdk";
import { UnstableValue } from "../NamespacedValue";
import { TEXT_NODE_TYPE } from "./extensible_events";
export declare enum LocationAssetType {
    Self = "m.self",
    Pin = "m.pin"
}
export declare const M_ASSET: UnstableValue<"m.asset", "org.matrix.msc3488.asset">;
export declare type MAssetContent = {
    type: LocationAssetType;
};
/**
 * The event definition for an m.asset event (in content)
 */
export declare type MAssetEvent = EitherAnd<{
    [M_ASSET.name]: MAssetContent;
}, {
    [M_ASSET.altName]: MAssetContent;
}>;
export declare const M_TIMESTAMP: UnstableValue<"m.ts", "org.matrix.msc3488.ts">;
/**
 * The event definition for an m.ts event (in content)
 */
export declare type MTimestampEvent = EitherAnd<{
    [M_TIMESTAMP.name]: number;
}, {
    [M_TIMESTAMP.altName]: number;
}>;
export declare const M_LOCATION: UnstableValue<"m.location", "org.matrix.msc3488.location">;
export declare type MLocationContent = {
    uri: string;
    description?: string | null;
};
export declare type MLocationEvent = EitherAnd<{
    [M_LOCATION.name]: MLocationContent;
}, {
    [M_LOCATION.altName]: MLocationContent;
}>;
export declare type MTextEvent = EitherAnd<{
    [TEXT_NODE_TYPE.name]: string;
}, {
    [TEXT_NODE_TYPE.altName]: string;
}>;
declare type OptionalTimestampEvent = MTimestampEvent | undefined;
/**
 * The content for an m.location event
*/
export declare type MLocationEventContent = MLocationEvent & MAssetEvent & MTextEvent & OptionalTimestampEvent;
export declare type LegacyLocationEventContent = {
    body: string;
    msgtype: string;
    geo_uri: string;
};
/**
 * Possible content for location events as sent over the wire
 */
export declare type LocationEventWireContent = Partial<LegacyLocationEventContent & MLocationEventContent>;
export declare type ILocationContent = MLocationEventContent & LegacyLocationEventContent;
export {};
//# sourceMappingURL=location.d.ts.map