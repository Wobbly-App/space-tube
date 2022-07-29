"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeBeaconInfoContent = exports.makeBeaconContent = exports.getTextForLocationEvent = void 0;
exports.makeEmoteMessage = makeEmoteMessage;
exports.makeHtmlEmote = makeHtmlEmote;
exports.makeHtmlMessage = makeHtmlMessage;
exports.makeHtmlNotice = makeHtmlNotice;
exports.makeLocationContent = void 0;
exports.makeNotice = makeNotice;
exports.makeTextMessage = makeTextMessage;
exports.parseTopicContent = exports.parseLocationEvent = exports.parseBeaconInfoContent = exports.parseBeaconContent = exports.makeTopicContent = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _matrixEventsSdk = require("matrix-events-sdk");

var _event = require("./@types/event");

var _extensible_events = require("./@types/extensible_events");

var _location = require("./@types/location");

var _topic = require("./@types/topic");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

/**
 * Generates the content for a HTML Message event
 * @param {string} body the plaintext body of the message
 * @param {string} htmlBody the HTML representation of the message
 * @returns {{msgtype: string, format: string, body: string, formatted_body: string}}
 */
function makeHtmlMessage(body, htmlBody) {
  return {
    msgtype: _event.MsgType.Text,
    format: "org.matrix.custom.html",
    body: body,
    formatted_body: htmlBody
  };
}
/**
 * Generates the content for a HTML Notice event
 * @param {string} body the plaintext body of the notice
 * @param {string} htmlBody the HTML representation of the notice
 * @returns {{msgtype: string, format: string, body: string, formatted_body: string}}
 */


function makeHtmlNotice(body, htmlBody) {
  return {
    msgtype: _event.MsgType.Notice,
    format: "org.matrix.custom.html",
    body: body,
    formatted_body: htmlBody
  };
}
/**
 * Generates the content for a HTML Emote event
 * @param {string} body the plaintext body of the emote
 * @param {string} htmlBody the HTML representation of the emote
 * @returns {{msgtype: string, format: string, body: string, formatted_body: string}}
 */


function makeHtmlEmote(body, htmlBody) {
  return {
    msgtype: _event.MsgType.Emote,
    format: "org.matrix.custom.html",
    body: body,
    formatted_body: htmlBody
  };
}
/**
 * Generates the content for a Plaintext Message event
 * @param {string} body the plaintext body of the emote
 * @returns {{msgtype: string, body: string}}
 */


function makeTextMessage(body) {
  return {
    msgtype: _event.MsgType.Text,
    body: body
  };
}
/**
 * Generates the content for a Plaintext Notice event
 * @param {string} body the plaintext body of the notice
 * @returns {{msgtype: string, body: string}}
 */


function makeNotice(body) {
  return {
    msgtype: _event.MsgType.Notice,
    body: body
  };
}
/**
 * Generates the content for a Plaintext Emote event
 * @param {string} body the plaintext body of the emote
 * @returns {{msgtype: string, body: string}}
 */


function makeEmoteMessage(body) {
  return {
    msgtype: _event.MsgType.Emote,
    body: body
  };
}
/** Location content helpers */


const getTextForLocationEvent = (uri, assetType, timestamp, description) => {
  const date = `at ${new Date(timestamp).toISOString()}`;
  const assetName = assetType === _location.LocationAssetType.Self ? 'User' : undefined;
  const quotedDescription = description ? `"${description}"` : undefined;
  return [assetName, 'Location', quotedDescription, uri, date].filter(Boolean).join(' ');
};
/**
 * Generates the content for a Location event
 * @param uri a geo:// uri for the location
 * @param ts the timestamp when the location was correct (milliseconds since
 *           the UNIX epoch)
 * @param description the (optional) label for this location on the map
 * @param asset_type the (optional) asset type of this location e.g. "m.self"
 * @param text optional. A text for the location
 */


exports.getTextForLocationEvent = getTextForLocationEvent;

const makeLocationContent = (text, uri, timestamp, description, assetType) => {
  const defaultedText = text !== null && text !== void 0 ? text : getTextForLocationEvent(uri, assetType || _location.LocationAssetType.Self, timestamp, description);
  const timestampEvent = timestamp ? {
    [_location.M_TIMESTAMP.name]: timestamp
  } : {};
  return _objectSpread({
    msgtype: _event.MsgType.Location,
    body: defaultedText,
    geo_uri: uri,
    [_location.M_LOCATION.name]: {
      description,
      uri
    },
    [_location.M_ASSET.name]: {
      type: assetType || _location.LocationAssetType.Self
    },
    [_extensible_events.TEXT_NODE_TYPE.name]: defaultedText
  }, timestampEvent);
};
/**
 * Parse location event content and transform to
 * a backwards compatible modern m.location event format
 */


exports.makeLocationContent = makeLocationContent;

const parseLocationEvent = wireEventContent => {
  var _location$uri, _asset$type;

  const location = _location.M_LOCATION.findIn(wireEventContent);

  const asset = _location.M_ASSET.findIn(wireEventContent);

  const timestamp = _location.M_TIMESTAMP.findIn(wireEventContent);

  const text = _extensible_events.TEXT_NODE_TYPE.findIn(wireEventContent);

  const geoUri = (_location$uri = location === null || location === void 0 ? void 0 : location.uri) !== null && _location$uri !== void 0 ? _location$uri : wireEventContent === null || wireEventContent === void 0 ? void 0 : wireEventContent.geo_uri;
  const description = location === null || location === void 0 ? void 0 : location.description;
  const assetType = (_asset$type = asset === null || asset === void 0 ? void 0 : asset.type) !== null && _asset$type !== void 0 ? _asset$type : _location.LocationAssetType.Self;
  const fallbackText = text !== null && text !== void 0 ? text : wireEventContent.body;
  return makeLocationContent(fallbackText, geoUri, timestamp, description, assetType);
};
/**
 * Topic event helpers
 */


exports.parseLocationEvent = parseLocationEvent;

const makeTopicContent = (topic, htmlTopic) => {
  const renderings = [{
    body: topic,
    mimetype: "text/plain"
  }];

  if ((0, _matrixEventsSdk.isProvided)(htmlTopic)) {
    renderings.push({
      body: htmlTopic,
      mimetype: "text/html"
    });
  }

  return {
    topic,
    [_topic.M_TOPIC.name]: renderings
  };
};

exports.makeTopicContent = makeTopicContent;

const parseTopicContent = content => {
  var _mtopic$find$body, _mtopic$find, _mtopic$find2;

  const mtopic = _topic.M_TOPIC.findIn(content);

  const text = (_mtopic$find$body = mtopic === null || mtopic === void 0 ? void 0 : (_mtopic$find = mtopic.find(r => !(0, _matrixEventsSdk.isProvided)(r.mimetype) || r.mimetype === "text/plain")) === null || _mtopic$find === void 0 ? void 0 : _mtopic$find.body) !== null && _mtopic$find$body !== void 0 ? _mtopic$find$body : content.topic;
  const html = mtopic === null || mtopic === void 0 ? void 0 : (_mtopic$find2 = mtopic.find(r => r.mimetype === "text/html")) === null || _mtopic$find2 === void 0 ? void 0 : _mtopic$find2.body;
  return {
    text,
    html
  };
};
/**
 * Beacon event helpers
 */


exports.parseTopicContent = parseTopicContent;

const makeBeaconInfoContent = (timeout, isLive, description, assetType, timestamp) => ({
  description,
  timeout,
  live: isLive,
  [_location.M_TIMESTAMP.name]: timestamp || Date.now(),
  [_location.M_ASSET.name]: {
    type: assetType !== null && assetType !== void 0 ? assetType : _location.LocationAssetType.Self
  }
});

exports.makeBeaconInfoContent = makeBeaconInfoContent;

/**
 * Flatten beacon info event content
 */
const parseBeaconInfoContent = content => {
  const {
    description,
    timeout,
    live
  } = content;

  const {
    type: assetType
  } = _location.M_ASSET.findIn(content);

  const timestamp = _location.M_TIMESTAMP.findIn(content);

  return {
    description,
    timeout,
    live,
    assetType,
    timestamp
  };
};

exports.parseBeaconInfoContent = parseBeaconInfoContent;

const makeBeaconContent = (uri, timestamp, beaconInfoEventId, description) => ({
  [_location.M_LOCATION.name]: {
    description,
    uri
  },
  [_location.M_TIMESTAMP.name]: timestamp,
  "m.relates_to": {
    rel_type: _matrixEventsSdk.REFERENCE_RELATION.name,
    event_id: beaconInfoEventId
  }
});

exports.makeBeaconContent = makeBeaconContent;

const parseBeaconContent = content => {
  const {
    description,
    uri
  } = _location.M_LOCATION.findIn(content);

  const timestamp = _location.M_TIMESTAMP.findIn(content);

  return {
    description,
    uri,
    timestamp
  };
};

exports.parseBeaconContent = parseBeaconContent;