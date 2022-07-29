import { VerificationBase as Base, VerificationEventHandlerMap } from "./Base";
import { MatrixEvent } from "../../models/event";
declare type EmojiMapping = [emoji: string, name: string];
export interface IGeneratedSas {
    decimal?: [number, number, number];
    emoji?: EmojiMapping[];
}
export interface ISasEvent {
    sas: IGeneratedSas;
    confirm(): Promise<void>;
    cancel(): void;
    mismatch(): void;
}
export declare enum SasEvent {
    ShowSas = "show_sas"
}
declare type EventHandlerMap = {
    [SasEvent.ShowSas]: (sas: ISasEvent) => void;
} & VerificationEventHandlerMap;
/**
 * @alias module:crypto/verification/SAS
 * @extends {module:crypto/verification/Base}
 */
export declare class SAS extends Base<SasEvent, EventHandlerMap> {
    private waitingForAccept;
    ourSASPubKey: string;
    theirSASPubKey: string;
    sasEvent: ISasEvent;
    static get NAME(): string;
    get events(): string[];
    protected doVerification: () => Promise<void>;
    canSwitchStartEvent(event: MatrixEvent): boolean;
    private sendStart;
    private doSendVerification;
    private doRespondVerification;
    private sendMAC;
    private checkMAC;
}
export {};
//# sourceMappingURL=SAS.d.ts.map