"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MediaHandler = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _logger = require("../logger");

var _call = require("./call");

/*
Copyright 2015, 2016 OpenMarket Ltd
Copyright 2017 New Vector Ltd
Copyright 2019, 2020 The Matrix.org Foundation C.I.C.
Copyright 2021 - 2022 Šimon Brandner <simon.bra.ag@gmail.com>

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
class MediaHandler {
  constructor(client) {
    this.client = client;
    (0, _defineProperty2.default)(this, "audioInput", void 0);
    (0, _defineProperty2.default)(this, "videoInput", void 0);
    (0, _defineProperty2.default)(this, "localUserMediaStream", void 0);
    (0, _defineProperty2.default)(this, "userMediaStreams", []);
    (0, _defineProperty2.default)(this, "screensharingStreams", []);
  }
  /**
   * Set an audio input device to use for MatrixCalls
   * @param {string} deviceId the identifier for the device
   * undefined treated as unset
   */


  async setAudioInput(deviceId) {
    _logger.logger.info("LOG setting audio input to", deviceId);

    if (this.audioInput === deviceId) return;
    this.audioInput = deviceId;
    await this.updateLocalUsermediaStreams();
  }
  /**
   * Set a video input device to use for MatrixCalls
   * @param {string} deviceId the identifier for the device
   * undefined treated as unset
   */


  async setVideoInput(deviceId) {
    _logger.logger.info("LOG setting video input to", deviceId);

    if (this.videoInput === deviceId) return;
    this.videoInput = deviceId;
    await this.updateLocalUsermediaStreams();
  }
  /**
   * Requests new usermedia streams and replace the old ones
   */


  async updateLocalUsermediaStreams() {
    if (this.userMediaStreams.length === 0) return;
    const callMediaStreamParams = new Map();

    for (const call of this.client.callEventHandler.calls.values()) {
      callMediaStreamParams.set(call.callId, {
        audio: call.hasLocalUserMediaAudioTrack,
        video: call.hasLocalUserMediaVideoTrack
      });
    }

    for (const call of this.client.callEventHandler.calls.values()) {
      if (call.state === _call.CallState.Ended || !callMediaStreamParams.has(call.callId)) continue;
      const {
        audio,
        video
      } = callMediaStreamParams.get(call.callId); // This stream won't be reusable as we will replace the tracks of the old stream

      const stream = await this.getUserMediaStream(audio, video, false);
      await call.updateLocalUsermediaStream(stream);
    }
  }

  async hasAudioDevice() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === "audioinput").length > 0;
  }

  async hasVideoDevice() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === "videoinput").length > 0;
  }
  /**
   * @param audio should have an audio track
   * @param video should have a video track
   * @param reusable is allowed to be reused by the MediaHandler
   * @returns {MediaStream} based on passed parameters
   */


  async getUserMediaStream(audio, video, reusable = true) {
    var _this$localUserMediaS, _this$localUserMediaS2, _this$localUserMediaS3, _this$localUserMediaS4;

    const shouldRequestAudio = audio && (await this.hasAudioDevice());
    const shouldRequestVideo = video && (await this.hasVideoDevice());
    let stream;

    if (!this.localUserMediaStream || this.localUserMediaStream.getAudioTracks().length === 0 && shouldRequestAudio || this.localUserMediaStream.getVideoTracks().length === 0 && shouldRequestVideo || ((_this$localUserMediaS = this.localUserMediaStream.getAudioTracks()[0]) === null || _this$localUserMediaS === void 0 ? void 0 : (_this$localUserMediaS2 = _this$localUserMediaS.getSettings()) === null || _this$localUserMediaS2 === void 0 ? void 0 : _this$localUserMediaS2.deviceId) !== this.audioInput || ((_this$localUserMediaS3 = this.localUserMediaStream.getVideoTracks()[0]) === null || _this$localUserMediaS3 === void 0 ? void 0 : (_this$localUserMediaS4 = _this$localUserMediaS3.getSettings()) === null || _this$localUserMediaS4 === void 0 ? void 0 : _this$localUserMediaS4.deviceId) !== this.videoInput) {
      const constraints = this.getUserMediaContraints(shouldRequestAudio, shouldRequestVideo);

      _logger.logger.log("Getting user media with constraints", constraints);

      stream = await navigator.mediaDevices.getUserMedia(constraints);

      for (const track of stream.getTracks()) {
        const settings = track.getSettings();

        if (track.kind === "audio") {
          this.audioInput = settings.deviceId;
        } else if (track.kind === "video") {
          this.videoInput = settings.deviceId;
        }
      }

      if (reusable) {
        this.localUserMediaStream = stream;
      }
    } else {
      stream = this.localUserMediaStream.clone();

      if (!shouldRequestAudio) {
        for (const track of stream.getAudioTracks()) {
          stream.removeTrack(track);
        }
      }

      if (!shouldRequestVideo) {
        for (const track of stream.getVideoTracks()) {
          stream.removeTrack(track);
        }
      }
    }

    if (reusable) {
      this.userMediaStreams.push(stream);
    }

    return stream;
  }
  /**
   * Stops all tracks on the provided usermedia stream
   */


  stopUserMediaStream(mediaStream) {
    _logger.logger.debug("Stopping usermedia stream", mediaStream.id);

    for (const track of mediaStream.getTracks()) {
      track.stop();
    }

    const index = this.userMediaStreams.indexOf(mediaStream);

    if (index !== -1) {
      _logger.logger.debug("Splicing usermedia stream out stream array", mediaStream.id);

      this.userMediaStreams.splice(index, 1);
    }

    if (this.localUserMediaStream === mediaStream) {
      this.localUserMediaStream = undefined;
    }
  }
  /**
   * @param desktopCapturerSourceId sourceId for Electron DesktopCapturer
   * @param reusable is allowed to be reused by the MediaHandler
   * @returns {MediaStream} based on passed parameters
   */


  async getScreensharingStream(desktopCapturerSourceId, reusable = true) {
    let stream;

    if (this.screensharingStreams.length === 0) {
      const screenshareConstraints = this.getScreenshareContraints(desktopCapturerSourceId);
      if (!screenshareConstraints) return null;

      if (desktopCapturerSourceId) {
        // We are using Electron
        _logger.logger.debug("Getting screensharing stream using getUserMedia()", desktopCapturerSourceId);

        stream = await navigator.mediaDevices.getUserMedia(screenshareConstraints);
      } else {
        // We are not using Electron
        _logger.logger.debug("Getting screensharing stream using getDisplayMedia()");

        stream = await navigator.mediaDevices.getDisplayMedia(screenshareConstraints);
      }
    } else {
      const matchingStream = this.screensharingStreams[this.screensharingStreams.length - 1];

      _logger.logger.log("Cloning screensharing stream", matchingStream.id);

      stream = matchingStream.clone();
    }

    if (reusable) {
      this.screensharingStreams.push(stream);
    }

    return stream;
  }
  /**
   * Stops all tracks on the provided screensharing stream
   */


  stopScreensharingStream(mediaStream) {
    _logger.logger.debug("Stopping screensharing stream", mediaStream.id);

    for (const track of mediaStream.getTracks()) {
      track.stop();
    }

    const index = this.screensharingStreams.indexOf(mediaStream);

    if (index !== -1) {
      _logger.logger.debug("Splicing screensharing stream out stream array", mediaStream.id);

      this.screensharingStreams.splice(index, 1);
    }
  }
  /**
   * Stops all local media tracks
   */


  stopAllStreams() {
    for (const stream of this.userMediaStreams) {
      for (const track of stream.getTracks()) {
        track.stop();
      }
    }

    for (const stream of this.screensharingStreams) {
      for (const track of stream.getTracks()) {
        track.stop();
      }
    }

    this.userMediaStreams = [];
    this.screensharingStreams = [];
    this.localUserMediaStream = undefined;
  }

  getUserMediaContraints(audio, video) {
    const isWebkit = !!navigator.webkitGetUserMedia;
    return {
      audio: audio ? {
        deviceId: this.audioInput ? {
          ideal: this.audioInput
        } : undefined
      } : false,
      video: video ? {
        deviceId: this.videoInput ? {
          ideal: this.videoInput
        } : undefined,

        /* We want 640x360.  Chrome will give it only if we ask exactly,
        FF refuses entirely if we ask exactly, so have to ask for ideal
        instead
        XXX: Is this still true?
        */
        width: isWebkit ? {
          exact: 640
        } : {
          ideal: 640
        },
        height: isWebkit ? {
          exact: 360
        } : {
          ideal: 360
        }
      } : false
    };
  }

  getScreenshareContraints(desktopCapturerSourceId) {
    if (desktopCapturerSourceId) {
      _logger.logger.debug("Using desktop capturer source", desktopCapturerSourceId);

      return {
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: "desktop",
            chromeMediaSourceId: desktopCapturerSourceId
          }
        }
      };
    } else {
      _logger.logger.debug("Not using desktop capturer source");

      return {
        audio: false,
        video: true
      };
    }
  }

}

exports.MediaHandler = MediaHandler;