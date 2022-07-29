"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isTimestampInDuration = exports.getBeaconInfoIdentifier = exports.BeaconEvent = exports.Beacon = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _location = require("../@types/location");

var _contentHelpers = require("../content-helpers");

var _utils = require("../utils");

var _typedEventEmitter = require("./typed-event-emitter");

/*
Copyright 2022 The Matrix.org Foundation C.I.C.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
let BeaconEvent;
exports.BeaconEvent = BeaconEvent;

(function (BeaconEvent) {
  BeaconEvent["New"] = "Beacon.new";
  BeaconEvent["Update"] = "Beacon.update";
  BeaconEvent["LivenessChange"] = "Beacon.LivenessChange";
  BeaconEvent["Destroy"] = "Beacon.Destroy";
  BeaconEvent["LocationUpdate"] = "Beacon.LocationUpdate";
})(BeaconEvent || (exports.BeaconEvent = BeaconEvent = {}));

const isTimestampInDuration = (startTimestamp, durationMs, timestamp) => timestamp >= startTimestamp && startTimestamp + durationMs >= timestamp; // beacon info events are uniquely identified by
// `<roomId>_<state_key>`


exports.isTimestampInDuration = isTimestampInDuration;

const getBeaconInfoIdentifier = event => `${event.getRoomId()}_${event.getStateKey()}`; // https://github.com/matrix-org/matrix-spec-proposals/pull/3672


exports.getBeaconInfoIdentifier = getBeaconInfoIdentifier;

class Beacon extends _typedEventEmitter.TypedEventEmitter {
  constructor(rootEvent) {
    super();
    this.rootEvent = rootEvent;
    (0, _defineProperty2.default)(this, "roomId", void 0);
    (0, _defineProperty2.default)(this, "_beaconInfo", void 0);
    (0, _defineProperty2.default)(this, "_isLive", void 0);
    (0, _defineProperty2.default)(this, "livenessWatchInterval", void 0);
    (0, _defineProperty2.default)(this, "_latestLocationState", void 0);
    (0, _defineProperty2.default)(this, "clearLatestLocation", () => {
      this._latestLocationState = undefined;
      this.emit(BeaconEvent.LocationUpdate, this.latestLocationState);
    });
    this.setBeaconInfo(this.rootEvent);
    this.roomId = this.rootEvent.getRoomId();
  }

  get isLive() {
    return this._isLive;
  }

  get identifier() {
    return getBeaconInfoIdentifier(this.rootEvent);
  }

  get beaconInfoId() {
    return this.rootEvent.getId();
  }

  get beaconInfoOwner() {
    return this.rootEvent.getStateKey();
  }

  get beaconInfoEventType() {
    return this.rootEvent.getType();
  }

  get beaconInfo() {
    return this._beaconInfo;
  }

  get latestLocationState() {
    return this._latestLocationState;
  }

  update(beaconInfoEvent) {
    if (getBeaconInfoIdentifier(beaconInfoEvent) !== this.identifier) {
      throw new Error('Invalid updating event');
    } // don't update beacon with an older event


    if (beaconInfoEvent.event.origin_server_ts < this.rootEvent.event.origin_server_ts) {
      return;
    }

    this.rootEvent = beaconInfoEvent;
    this.setBeaconInfo(this.rootEvent);
    this.emit(BeaconEvent.Update, beaconInfoEvent, this);
    this.clearLatestLocation();
  }

  destroy() {
    if (this.livenessWatchInterval) {
      clearInterval(this.livenessWatchInterval);
    }

    this._isLive = false;
    this.emit(BeaconEvent.Destroy, this.identifier);
  }
  /**
   * Monitor liveness of a beacon
   * Emits BeaconEvent.LivenessChange when beacon expires
   */


  monitorLiveness() {
    if (this.livenessWatchInterval) {
      clearInterval(this.livenessWatchInterval);
    }

    this.checkLiveness();

    if (this.isLive) {
      var _this$_beaconInfo, _this$_beaconInfo2;

      const expiryInMs = ((_this$_beaconInfo = this._beaconInfo) === null || _this$_beaconInfo === void 0 ? void 0 : _this$_beaconInfo.timestamp) + ((_this$_beaconInfo2 = this._beaconInfo) === null || _this$_beaconInfo2 === void 0 ? void 0 : _this$_beaconInfo2.timeout) - Date.now();

      if (expiryInMs > 1) {
        this.livenessWatchInterval = setInterval(() => {
          this.monitorLiveness();
        }, expiryInMs);
      }
    }
  }
  /**
   * Process Beacon locations
   * Emits BeaconEvent.LocationUpdate
   */


  addLocations(beaconLocationEvents) {
    var _validLocationEvents$;

    // discard locations for beacons that are not live
    if (!this.isLive) {
      return;
    }

    const validLocationEvents = beaconLocationEvents.filter(event => {
      const content = event.getContent();

      const timestamp = _location.M_TIMESTAMP.findIn(content);

      return (// only include positions that were taken inside the beacon's live period
        isTimestampInDuration(this._beaconInfo.timestamp, this._beaconInfo.timeout, timestamp) && ( // ignore positions older than our current latest location
        !this.latestLocationState || timestamp > this.latestLocationState.timestamp)
      );
    });
    const latestLocationEvent = (_validLocationEvents$ = validLocationEvents.sort(_utils.sortEventsByLatestContentTimestamp)) === null || _validLocationEvents$ === void 0 ? void 0 : _validLocationEvents$[0];

    if (latestLocationEvent) {
      this._latestLocationState = (0, _contentHelpers.parseBeaconContent)(latestLocationEvent.getContent());
      this.emit(BeaconEvent.LocationUpdate, this.latestLocationState);
    }
  }

  setBeaconInfo(event) {
    this._beaconInfo = (0, _contentHelpers.parseBeaconInfoContent)(event.getContent());
    this.checkLiveness();
  }

  checkLiveness() {
    var _this$_beaconInfo3, _this$_beaconInfo4, _this$_beaconInfo5;

    const prevLiveness = this.isLive;
    this._isLive = ((_this$_beaconInfo3 = this._beaconInfo) === null || _this$_beaconInfo3 === void 0 ? void 0 : _this$_beaconInfo3.live) && isTimestampInDuration((_this$_beaconInfo4 = this._beaconInfo) === null || _this$_beaconInfo4 === void 0 ? void 0 : _this$_beaconInfo4.timestamp, (_this$_beaconInfo5 = this._beaconInfo) === null || _this$_beaconInfo5 === void 0 ? void 0 : _this$_beaconInfo5.timeout, Date.now());

    if (prevLiveness !== this.isLive) {
      this.emit(BeaconEvent.LivenessChange, this.isLive, this);
    }
  }

}

exports.Beacon = Beacon;