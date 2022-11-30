require("dotenv").config();

const {
  matrix_server,
  matrix_server_id,
  bot_username,
  bot_password,
  xylophone_username,
  xylophone_password,
  zebra_username,
  zebra_password,
  xylophone_room_id,
  zebra_room_id,
} = process.env;

global.Olm = require("olm");

const sdk = require("matrix-js-sdk");
const matrixcs = require("matrix-js-sdk/lib/matrix");
const request = require("request");
matrixcs.request(request);

const axios = require("axios");

async function startApp() {
  //create client
  const client = sdk.createClient(matrix_server);
  const zebraClient = sdk.createClient(matrix_server);
  const xylophoneClient = sdk.createClient(matrix_server);

  console.log("client created");

  await client.loginWithPassword(bot_username, bot_password);

  await xylophoneClient.loginWithPassword(
    xylophone_username,
    xylophone_password
  );
  await zebraClient.loginWithPassword(zebra_username, zebra_password);

  console.log("starting client");
  await client.startClient({ initialSyncLimit: 10 });
  await xylophoneClient.startClient({ initialSyncLimit: 10 });
  await zebraClient.startClient({ initialSyncLimit: 10 });

  console.log("logging in");

  //load messages
  console.log("loading rooms");

  const xylophoneZebraRooms = {
    xylophone: xylophone_room_id,
    zebra: zebra_room_id,
  };

  const commands = {
    "set-name": {
      description:
        "Change the name displayed that your group sends messages from",
      example: "!set-name New Name",
      action: (message, client) => {
        const namesArray = message.split(" ");
        namesArray.shift();
        const newName = namesArray.join(" ");
        client.setDisplayName(newName);
      },
    },
    "set-picture": {
      description:
        "Change the picture that your represents your group using image url.",
      example:
        "!set-picture https://en.wikipedia.org/wiki/Columbidae#/media/File:Treron_vernans_male_-_Kent_Ridge_Park.jpg",
      action: async (message, client) => {
        const imageUrl = message
          .split(" ")[1]
          .replace("<", "")
          .replace(">", "");
        console.log(imageUrl);
        const imageResponse = await axios.get(imageUrl, {
          responseType: "arraybuffer",
        });
        const imageType = imageResponse.headers["content-type"];
        const uploadResponse = await client.uploadContent(imageResponse.data, {
          rawResponse: false,
          type: imageType,
          onlyContentUri: false,
        });
        console.log(uploadResponse);
        const matrixUrl = uploadResponse.content_uri;
        client.setAvatarUrl(matrixUrl);
      },
    },
  };

  const scriptStart = Date.now();

  client.on("Room.timeline", function (event, room, toStartOfTimeline) {
    const roomId = event.event.room_id;
    const eventTime = event.event.origin_server_ts;
    const sender = event.event.sender;

    const id = {
      bot: `@${bot_username}:${matrix_server_id}`,
      xylophone: `@${xylophone_username}:${matrix_server_id}`,
      zebra: `@${zebra_username}:${matrix_server_id}`,
    };

    if (scriptStart > eventTime) {
      return; //don't run commands for old messages
    }

    if (event.getType() !== "m.room.message") {
      return; // only use messages
    }

    if (sender == id.bot) {
      return; //don't run commands sent by space-tube-bot
    }

    if (Object.values(xylophoneZebraRooms).includes(roomId)) {
      const message = event.event.content.body;

      if (roomId === xylophoneZebraRooms.xylophone) {
        if (sender != id.xylophone && sender != id.zebra) {
          if (message.slice(0, 1) !== "!") {
            client.redactEvent(roomId, event.event.event_id);

            xylophoneClient.sendTextMessage(
              xylophoneZebraRooms.xylophone,
              message
            );
            xylophoneClient.sendTextMessage(xylophoneZebraRooms.zebra, message);
          }

          const command = message.split(" ")[0];

          if (command == "!set-name") {
            commands["set-name"].action(message, xylophoneClient);
          }
          if (command == "!set-picture") {
            commands["set-picture"].action(message, xylophoneClient);
          }
        }
      }
      if (roomId === xylophoneZebraRooms.zebra) {
        if (sender != id.xylophone && sender != id.zebra) {
          if (message.slice(0, 1) !== "!") {
            client.redactEvent(roomId, event.event.event_id);

            zebraClient.sendTextMessage(xylophoneZebraRooms.xylophone, message);
            zebraClient.sendTextMessage(xylophoneZebraRooms.zebra, message);
          }

          const command = message.split(" ")[0];

          if (command == "!set-name") {
            commands["set-name"].action(message, zebraClient);
          }
          if (command == "!set-picture") {
            commands["set-picture"].action(message, zebraClient);
          }
        }
      }
    }
  });
}

startApp();
