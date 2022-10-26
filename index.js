require("dotenv").config();

const {
  matrix_server,
  bot_username,
  bot_password,
  whatsapp_room_id,
  apples_room_id,
  bananas_room_id,
  interactions_room_id,
  new_interactions_room_id,
  discord_room_id,
  xylophone_username,
  xylophone_password,
  zebra_username,
  zebra_password,
  codeop_username,
  codeop_password,
  commonknowledge_username,
  commonknowledge_password,
  codeop_username2,
  codeop_password2,
  commonknowledge_username2,
  commonknowledge_password2,
  xylophone_room_id,
  zebra_room_id,
  codeop_room_id,
  commonknowledge_room_id,
} = process.env;

global.Olm = require("olm");

const sdk = require("matrix-js-sdk");
const matrixcs = require("matrix-js-sdk/lib/matrix");
const request = require("request");
matrixcs.request(request);

const axios = require("axios");

const localStorage = global.localStorage;
const {
  LocalStorageCryptoStore,
} = require("matrix-js-sdk/lib/crypto/store/localStorage-crypto-store");

async function startApp() {
  //create client
  const client = sdk.createClient(matrix_server);
  const zebraClient = sdk.createClient(matrix_server);
  const xylophoneClient = sdk.createClient(matrix_server);
  const codeOpClient = sdk.createClient(matrix_server);
  const commonKnowledgeClient = sdk.createClient(matrix_server);

  console.log("client created");

  try {
    await client.loginWithPassword(bot_username, bot_password);

    await xylophoneClient.loginWithPassword(
      xylophone_username,
      xylophone_password
    );
    await zebraClient.loginWithPassword(zebra_username, zebra_password);

    await codeOpClient.loginWithPassword(codeop_username2, codeop_password2);
    await commonKnowledgeClient.loginWithPassword(
      commonknowledge_username2,
      commonknowledge_password2
    );
  } catch (e) {
    console.log(e);
  }

  console.log("starting client");
  await client.startClient({ initialSyncLimit: 10 });

  await xylophoneClient.startClient({ initialSyncLimit: 10 });
  await zebraClient.startClient({ initialSyncLimit: 10 });

  try {
    await codeOpClient.startClient({ initialSyncLimit: 10 });
  } catch (err) {
    console.log(err);
  }

  await commonKnowledgeClient.startClient({ initialSyncLimit: 10 });

  console.log("logging in");

  //load messages
  console.log("loading rooms");
  const rooms = await client.getRooms();

  const whatsappRoomId = whatsapp_room_id;

  /* Create the chat with the discord bot, get the room id for this later on
  await client.createRoom({
    invite: ["@_discord_bot:wobbly.app"],
  });
  */

  const rooms2 = client.getRooms();

  console.log("rooms", rooms2);

  //add event handler for messages, this is the part that does the whatsapp bridging

  rooms2.forEach((room) => {
    console.log(room.room_id);
  });

  const activeRooms = {
    Apples: apples_room_id,
    Bananas: bananas_room_id,
    Interactions: interactions_room_id,
    NewInteractions: new_interactions_room_id,
  };

  console.log(activeRooms);

  const xylophoneZebraRooms = {
    xylophone: xylophone_room_id,
    zebra: zebra_room_id,
  };

  const coopRooms = {
    codeOperative: codeop_room_id,
    commonKnowledge: commonknowledge_room_id,
  };

  /*
  await codeOpClient.joinRoom(coopRooms.codeOperative);
  await commonKnowledgeClient.joinRoom(coopRooms.codeOperative);
  await codeOpClient.joinRoom(coopRooms.commonKnowledge);
  await commonKnowledgeClient.joinRoom(coopRooms.commonKnowledge);
  */

  /*
  await xylophoneClient.joinRoom(xylophoneZebraRooms.xylophone);
  await zebraClient.joinRoom(xylophoneZebraRooms.xylophone);
  await xylophoneClient.joinRoom(xylophoneZebraRooms.zebra);
  await zebraClient.joinRoom(xylophoneZebraRooms.zebra);
  */

  //client.setDisplayName("Space Tube");

  //xylophoneClient.setDisplayName("Xylophone Club");

  /*
  await xylophoneClient.sendTextMessage(
    xylophoneZebraRooms.xylophone,
    "changing my avatar"
  );
  */

  //client.sendTextMessage(whatsappRoomId, "login");

  const checkRooms = () => {
    const rooms = client.getRooms();

    rooms.forEach((room) => {
      console.log(room.name, room.summary.roomId);
      if (
        room.summary.roomId == activeRooms["Apples"] ||
        room.summary.roomId == activeRooms["Bananas"]
      ) {
        console.log(room.selfMembership);
        if (room.selfMembership === "invite") {
          client.joinRoom(room.summary.roomId);
        }
      }

      if (
        room.summary.roomId == exploreRooms.roomA ||
        room.summary.roomId == exploreRooms.roomB
      ) {
        //console.log(room);
      }

      /*
      if (room.summary.roomId === exploreRooms.SpaceTubeToWobbly) {
        const events = room.currentState.events;
        const avatarEvent = events.get("m.room.avatar").get("");
        console.log(avatarEvent.event);
      }
      */
    });
  };

  client.once("sync", async (state, prevState, res) => {
    // state will be 'PREPARED' when the client is ready to use
    console.log(state);
    checkRooms();
  });

  const scriptStart = Date.now();

  client.on("Room.timeline", function (event, room, toStartOfTimeline) {
    console.log("an event happened", event.getType(), event.event.content.body);

    //console.log(event.getType());
    const roomId = event.event.room_id;

    const eventTime = event.event.origin_server_ts;

    if (scriptStart > eventTime) {
      return; //don't run commands for old messages
    }

    if (event.getType() !== "m.room.message") {
      return; // only use messages
    }

    if (Object.values(activeRooms).includes(roomId)) {
      console.log("a linked room spaketh");

      const message = event.event.content.body;
      const command = message.split(" ")[0];

      if (command.slice(0, 3) == "!to") {
        const address = command.slice(4);

        if (activeRooms[address]) {
          const restOfMessage = message.slice(command.length);
          const from = `from:${room.name}`;

          client.sendTextMessage(activeRooms[address], from + restOfMessage);
        } else {
          client.sendTextMessage(roomId, "no group linked with that alias");
        }
      }

      // Interaction commands

      if (event.event.content.body.slice(0, 5) == "!echo") {
        client.sendTextMessage(roomId, event.event.content.body.slice(5));
      }
      if (event.event.content.body.slice(0, 9) == "!all-caps") {
        client.sendTextMessage(
          roomId,
          event.event.content.body.slice(9).toUpperCase()
        );
      }
      if (event.event.content.body.slice(0, 7) == "!random") {
        client.sendTextMessage(roomId, "" + Math.random());
      }
      if (event.event.content.body.slice(0, 8) == "!reverse") {
        const message = event.event.content.body.slice(8);
        const reversed = message.split("").reverse().join("");

        client.sendTextMessage(roomId, reversed);
      }
      if (event.event.content.body.slice(0, 9) == "!multiply") {
        const message = event.event.content.body.slice(9);
        const numbers = message.split(" ");

        const answer = parseInt(numbers[1]) * parseInt(numbers[2]);

        client.sendTextMessage(roomId, "" + answer);
      }
      if (event.event.content.body.slice(0, 8) == "!fuck-up") {
        const message = event.event.content.body.slice(9);
        const fuckedUpMessage = message
          .split("")
          .map((letter, i) => {
            if (i % 3 == 0) {
              const alphabet = "abcdefghijklmnopqrstuvwxyz";
              return alphabet[Math.floor(Math.random() * 26)];
            } else return letter;
          })
          .join("");

        client.sendTextMessage(roomId, fuckedUpMessage);
      }
    }

    if (Object.values(exploreRooms).includes(roomId)) {
      const message = event.event.content.body;
      console.log(message);

      if (roomId === exploreRooms.SpaceTubeToWobbly) {
        console.log("space tube sent a message");

        if (event.event.sender != "@wobbly-bot:wobbly.app")
          client.sendTextMessage(
            exploreRooms.WobblyToSpaceTube,
            "Space-Tube: " + message
          );
      }
      if (roomId === exploreRooms.WobblyToSpaceTube) {
        console.log("wobbly sent a message");

        if (event.event.sender != "@wobbly-bot:wobbly.app")
          client.sendTextMessage(
            exploreRooms.SpaceTubeToWobbly,
            "Wobbly: " + message
          );
      }
    }

    if (Object.values(xylophoneZebraRooms).includes(roomId)) {
      const message = event.event.content.body;

      console.log(message);

      console.log(roomId, xylophoneZebraRooms.xylophone);

      if (roomId === xylophoneZebraRooms.xylophone) {
        console.log("message in xylophone");
        if (
          event.event.sender != "@xylophone2:wobbly.app" &&
          event.event.sender != "@zebra2:wobbly.app"
        ) {
          if (message.slice(0, 1) !== "!") {
            client.redactEvent(roomId, event.event.event_id);

            xylophoneClient.sendTextMessage(
              xylophoneZebraRooms.xylophone,
              message
            );
            xylophoneClient.sendTextMessage(xylophoneZebraRooms.zebra, message);
          }

          const commands = {
            "set-name": {
              description:
                "Change the name displayed that your group sends messages from",
              example: "!set-name New Name",
              action: (message, client) => {
                const namesArray = message.split(" ");
                namesArray.shift();
                const newName = namesArray.join(" ");
                console.log(newName);
                client.setDisplayName(newName);
              },
            },
          };

          const command = message.split(" ")[0];

          if (command == "!set-name") {
            commands["set-name"].action(message, xylophoneClient);
          }
        }
      }
      if (roomId === xylophoneZebraRooms.zebra) {
        if (
          event.event.sender != "@xylophone2:wobbly.app" &&
          event.event.sender != "@zebra2:wobbly.app"
        ) {
          if (message.slice(0, 1) !== "!") {
            client.redactEvent(roomId, event.event.event_id);

            zebraClient.sendTextMessage(xylophoneZebraRooms.xylophone, message);
            zebraClient.sendTextMessage(xylophoneZebraRooms.zebra, message);
          }

          const commands = {
            "set-name": {
              description:
                "Change the name displayed that your group sends messages from",
              example: "!set-name New Name",
              action: (message, client) => {
                const namesArray = message.split(" ");
                namesArray.shift();
                const newName = namesArray.join(" ");
                console.log(newName);
                client.setDisplayName(newName);
              },
            },
          };

          const command = message.split(" ")[0];

          if (command == "!set-name") {
            commands["set-name"].action(message, zebraClient);
          }
        }
      }
    }

    if (Object.values(coopRooms).includes(roomId)) {
      const message = event.event.content.body;

      console.log(message);

      if (roomId === coopRooms.codeOperative) {
        console.log("message in code-op");
        if (
          event.event.sender != "@code_operative:wobbly.app" &&
          event.event.sender != "@common_knowledge:wobbly.app"
        ) {
          if (message.slice(0, 1) !== "!") {
            client.redactEvent(roomId, event.event.event_id);

            codeOpClient.sendTextMessage(coopRooms.codeOperative, message);
            codeOpClient.sendTextMessage(coopRooms.commonKnowledge, message);
          }

          const commands = {
            "set-name": {
              description:
                "Change the name displayed that your group sends messages from",
              example: "!set-name New Name",
              action: (message, client) => {
                const namesArray = message.split(" ");
                namesArray.shift();
                const newName = namesArray.join(" ");
                console.log(newName);
                client.setDisplayName(newName);
              },
            },
          };

          const command = message.split(" ")[0];

          if (command == "!set-name") {
            commands["set-name"].action(message, codeOpClient);
          }
        }
      }
      if (roomId === coopRooms.commonKnowledge) {
        console.log("message in common-knowledge");
        if (
          event.event.sender != "@code_operative:wobbly.app" &&
          event.event.sender != "@common_knowledge:wobbly.app"
        ) {
          if (message.slice(0, 1) !== "!") {
            client.redactEvent(roomId, event.event.event_id);

            commonKnowledgeClient.sendTextMessage(
              coopRooms.codeOperative,
              message
            );
            commonKnowledgeClient.sendTextMessage(
              coopRooms.commonKnowledge,
              message
            );
          }

          const commands = {
            "set-name": {
              description:
                "Change the name displayed that your group sends messages from",
              example: "!set-name New Name",
              action: (message, client) => {
                const namesArray = message.split(" ");
                namesArray.shift();
                const newName = namesArray.join(" ");
                console.log(newName);
                client.setDisplayName(newName);
              },
            },
          };

          const command = message.split(" ")[0];

          if (command == "!set-name") {
            commands["set-name"].action(message, commonKnowledgeClient);
          }
        }
      }
    }

    //need to find id of the newly created room that bridges the groups

    //console.log(event.event.content.body);
    //console.log(room);

    if (event.event.content.url) {
      console.log(event.event.content.url);

      const url = client.mxcUrlToHttp(event.event.content.url, 100, 100);

      console.log(url);
    }
  });
}

startApp();
