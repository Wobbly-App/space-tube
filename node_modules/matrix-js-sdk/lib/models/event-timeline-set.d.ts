/**
 * @module models/event-timeline-set
 */
import { EventTimeline, IAddEventOptions } from "./event-timeline";
import { MatrixEvent } from "./event";
import { Room, RoomEvent } from "./room";
import { Filter } from "../filter";
import { RoomState } from "./room-state";
import { TypedEventEmitter } from "./typed-event-emitter";
import { RelationsContainer } from "./relations-container";
import { MatrixClient } from "../client";
import { Thread } from "./thread";
interface IOpts {
    timelineSupport?: boolean;
    filter?: Filter;
    pendingEvents?: boolean;
}
export declare enum DuplicateStrategy {
    Ignore = "ignore",
    Replace = "replace"
}
export interface IRoomTimelineData {
    timeline: EventTimeline;
    liveEvent?: boolean;
}
export interface IAddEventToTimelineOptions extends Pick<IAddEventOptions, 'toStartOfTimeline' | 'roomState' | 'timelineWasEmpty'> {
    /** Whether the sync response came from cache */
    fromCache?: boolean;
}
export interface IAddLiveEventOptions extends Pick<IAddEventToTimelineOptions, 'fromCache' | 'roomState' | 'timelineWasEmpty'> {
    /** Applies to events in the timeline only. If this is 'replace' then if a
     * duplicate is encountered, the event passed to this function will replace
     * the existing event in the timeline. If this is not specified, or is
     * 'ignore', then the event passed to this function will be ignored
     * entirely, preserving the existing event in the timeline. Events are
     * identical based on their event ID <b>only</b>. */
    duplicateStrategy?: DuplicateStrategy;
}
declare type EmittedEvents = RoomEvent.Timeline | RoomEvent.TimelineReset;
export declare type EventTimelineSetHandlerMap = {
    [RoomEvent.Timeline]: (event: MatrixEvent, room: Room, toStartOfTimeline: boolean, removed: boolean, data: IRoomTimelineData) => void;
    [RoomEvent.TimelineReset]: (room: Room, eventTimelineSet: EventTimelineSet, resetAllTimelines: boolean) => void;
};
export declare class EventTimelineSet extends TypedEventEmitter<EmittedEvents, EventTimelineSetHandlerMap> {
    readonly room: Room | undefined;
    readonly thread?: Thread;
    readonly relations?: RelationsContainer;
    private readonly timelineSupport;
    private readonly displayPendingEvents;
    private liveTimeline;
    private timelines;
    private _eventIdToTimeline;
    private filter?;
    /**
     * Construct a set of EventTimeline objects, typically on behalf of a given
     * room.  A room may have multiple EventTimelineSets for different levels
     * of filtering.  The global notification list is also an EventTimelineSet, but
     * lacks a room.
     *
     * <p>This is an ordered sequence of timelines, which may or may not
     * be continuous. Each timeline lists a series of events, as well as tracking
     * the room state at the start and the end of the timeline (if appropriate).
     * It also tracks forward and backward pagination tokens, as well as containing
     * links to the next timeline in the sequence.
     *
     * <p>There is one special timeline - the 'live' timeline, which represents the
     * timeline to which events are being added in real-time as they are received
     * from the /sync API. Note that you should not retain references to this
     * timeline - even if it is the current timeline right now, it may not remain
     * so if the server gives us a timeline gap in /sync.
     *
     * <p>In order that we can find events from their ids later, we also maintain a
     * map from event_id to timeline and index.
     *
     * @constructor
     * @param {Room=} room
     * Room for this timelineSet. May be null for non-room cases, such as the
     * notification timeline.
     * @param {Object} opts Options inherited from Room.
     *
     * @param {boolean} [opts.timelineSupport = false]
     * Set to true to enable improved timeline support.
     * @param {Object} [opts.filter = null]
     * The filter object, if any, for this timelineSet.
     * @param {MatrixClient=} client the Matrix client which owns this EventTimelineSet,
     * can be omitted if room is specified.
     * @param {Thread=} thread the thread to which this timeline set relates.
     */
    constructor(room: Room | undefined, opts?: IOpts, client?: MatrixClient, thread?: Thread);
    /**
     * Get all the timelines in this set
     * @return {module:models/event-timeline~EventTimeline[]} the timelines in this set
     */
    getTimelines(): EventTimeline[];
    /**
     * Get the filter object this timeline set is filtered on, if any
     * @return {?Filter} the optional filter for this timelineSet
     */
    getFilter(): Filter | undefined;
    /**
     * Set the filter object this timeline set is filtered on
     * (passed to the server when paginating via /messages).
     * @param {Filter} filter the filter for this timelineSet
     */
    setFilter(filter?: Filter): void;
    /**
     * Get the list of pending sent events for this timelineSet's room, filtered
     * by the timelineSet's filter if appropriate.
     *
     * @return {module:models/event.MatrixEvent[]} A list of the sent events
     * waiting for remote echo.
     *
     * @throws If <code>opts.pendingEventOrdering</code> was not 'detached'
     */
    getPendingEvents(): MatrixEvent[];
    /**
     * Get the live timeline for this room.
     *
     * @return {module:models/event-timeline~EventTimeline} live timeline
     */
    getLiveTimeline(): EventTimeline;
    /**
     * Set the live timeline for this room.
     *
     * @return {module:models/event-timeline~EventTimeline} live timeline
     */
    setLiveTimeline(timeline: EventTimeline): void;
    /**
     * Return the timeline (if any) this event is in.
     * @param {String} eventId the eventId being sought
     * @return {module:models/event-timeline~EventTimeline} timeline
     */
    eventIdToTimeline(eventId: string): EventTimeline;
    /**
     * Track a new event as if it were in the same timeline as an old event,
     * replacing it.
     * @param {String} oldEventId  event ID of the original event
     * @param {String} newEventId  event ID of the replacement event
     */
    replaceEventId(oldEventId: string, newEventId: string): void;
    /**
     * Reset the live timeline, and start a new one.
     *
     * <p>This is used when /sync returns a 'limited' timeline.
     *
     * @param {string=} backPaginationToken   token for back-paginating the new timeline
     * @param {string=} forwardPaginationToken token for forward-paginating the old live timeline,
     * if absent or null, all timelines are reset.
     *
     * @fires module:client~MatrixClient#event:"Room.timelineReset"
     */
    resetLiveTimeline(backPaginationToken?: string, forwardPaginationToken?: string): void;
    /**
     * Get the timeline which contains the given event, if any
     *
     * @param {string} eventId  event ID to look for
     * @return {?module:models/event-timeline~EventTimeline} timeline containing
     * the given event, or null if unknown
     */
    getTimelineForEvent(eventId: string): EventTimeline | null;
    /**
     * Get an event which is stored in our timelines
     *
     * @param {string} eventId  event ID to look for
     * @return {?module:models/event~MatrixEvent} the given event, or undefined if unknown
     */
    findEventById(eventId: string): MatrixEvent | undefined;
    /**
     * Add a new timeline to this timeline list
     *
     * @return {module:models/event-timeline~EventTimeline} newly-created timeline
     */
    addTimeline(): EventTimeline;
    /**
     * Add events to a timeline
     *
     * <p>Will fire "Room.timeline" for each event added.
     *
     * @param {MatrixEvent[]} events A list of events to add.
     *
     * @param {boolean} toStartOfTimeline   True to add these events to the start
     * (oldest) instead of the end (newest) of the timeline. If true, the oldest
     * event will be the <b>last</b> element of 'events'.
     *
     * @param {module:models/event-timeline~EventTimeline} timeline   timeline to
     *    add events to.
     *
     * @param {string=} paginationToken   token for the next batch of events
     *
     * @fires module:client~MatrixClient#event:"Room.timeline"
     *
     */
    addEventsToTimeline(events: MatrixEvent[], toStartOfTimeline: boolean, timeline: EventTimeline, paginationToken: string): void;
    /**
     * Add an event to the end of this live timeline.
     *
     * @param {MatrixEvent} event Event to be added
     * @param {IAddLiveEventOptions} options addLiveEvent options
     */
    addLiveEvent(event: MatrixEvent, { duplicateStrategy, fromCache, roomState, timelineWasEmpty, }: IAddLiveEventOptions): void;
    /**
     * @deprecated In favor of the overload with `IAddLiveEventOptions`
     */
    addLiveEvent(event: MatrixEvent, duplicateStrategy?: DuplicateStrategy, fromCache?: boolean, roomState?: RoomState): void;
    /**
     * Add event to the given timeline, and emit Room.timeline. Assumes
     * we have already checked we don't know about this event.
     *
     * Will fire "Room.timeline" for each event added.
     *
     * @param {MatrixEvent} event
     * @param {EventTimeline} timeline
     * @param {IAddEventToTimelineOptions} options addEventToTimeline options
     *
     * @fires module:client~MatrixClient#event:"Room.timeline"
     */
    addEventToTimeline(event: MatrixEvent, timeline: EventTimeline, { toStartOfTimeline, fromCache, roomState, timelineWasEmpty, }: IAddEventToTimelineOptions): void;
    /**
     * @deprecated In favor of the overload with `IAddEventToTimelineOptions`
     */
    addEventToTimeline(event: MatrixEvent, timeline: EventTimeline, toStartOfTimeline: boolean, fromCache?: boolean, roomState?: RoomState): void;
    /**
     * Replaces event with ID oldEventId with one with newEventId, if oldEventId is
     * recognised.  Otherwise, add to the live timeline.  Used to handle remote echos.
     *
     * @param {MatrixEvent} localEvent     the new event to be added to the timeline
     * @param {String} oldEventId          the ID of the original event
     * @param {boolean} newEventId         the ID of the replacement event
     *
     * @fires module:client~MatrixClient#event:"Room.timeline"
     */
    handleRemoteEcho(localEvent: MatrixEvent, oldEventId: string, newEventId: string): void;
    /**
     * Removes a single event from this room.
     *
     * @param {String} eventId  The id of the event to remove
     *
     * @return {?MatrixEvent} the removed event, or null if the event was not found
     * in this room.
     */
    removeEvent(eventId: string): MatrixEvent | null;
    /**
     * Determine where two events appear in the timeline relative to one another
     *
     * @param {string} eventId1   The id of the first event
     * @param {string} eventId2   The id of the second event

     * @return {?number} a number less than zero if eventId1 precedes eventId2, and
     *    greater than zero if eventId1 succeeds eventId2. zero if they are the
     *    same event; null if we can't tell (either because we don't know about one
     *    of the events, or because they are in separate timelines which don't join
     *    up).
     */
    compareEventOrdering(eventId1: string, eventId2: string): number | null;
    /**
     * Determine whether a given event can sanely be added to this event timeline set,
     * for timeline sets relating to a thread, only return true for events in the same
     * thread timeline, for timeline sets not relating to a thread only return true
     * for events which should be shown in the main room timeline.
     * Requires the `room` property to have been set at EventTimelineSet construction time.
     *
     * @param event {MatrixEvent} the event to check whether it belongs to this timeline set.
     * @throws {Error} if `room` was not set when constructing this timeline set.
     * @return {boolean} whether the event belongs to this timeline set.
     */
    canContain(event: MatrixEvent): boolean;
}
export {};
/**
 * Fires whenever the timeline in a room is updated.
 * @event module:client~MatrixClient#"Room.timeline"
 * @param {MatrixEvent} event The matrix event which caused this event to fire.
 * @param {?Room} room The room, if any, whose timeline was updated.
 * @param {boolean} toStartOfTimeline True if this event was added to the start
 * @param {boolean} removed True if this event has just been removed from the timeline
 * (beginning; oldest) of the timeline e.g. due to pagination.
 *
 * @param {object} data  more data about the event
 *
 * @param {module:models/event-timeline.EventTimeline} data.timeline the timeline the
 * event was added to/removed from
 *
 * @param {boolean} data.liveEvent true if the event was a real-time event
 * added to the end of the live timeline
 *
 * @example
 * matrixClient.on("Room.timeline",
 *                 function(event, room, toStartOfTimeline, removed, data) {
 *   if (!toStartOfTimeline && data.liveEvent) {
 *     var messageToAppend = room.timeline.[room.timeline.length - 1];
 *   }
 * });
 */
/**
 * Fires whenever the live timeline in a room is reset.
 *
 * When we get a 'limited' sync (for example, after a network outage), we reset
 * the live timeline to be empty before adding the recent events to the new
 * timeline. This event is fired after the timeline is reset, and before the
 * new events are added.
 *
 * @event module:client~MatrixClient#"Room.timelineReset"
 * @param {Room} room The room whose live timeline was reset, if any
 * @param {EventTimelineSet} timelineSet timelineSet room whose live timeline was reset
 * @param {boolean} resetAllTimelines True if all timelines were reset.
 */
//# sourceMappingURL=event-timeline-set.d.ts.map