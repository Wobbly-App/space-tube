require("dotenv").config();

const {
  matrix_server,
  bot_username,
  bot_password,
  whatsapp_room_id,
  apples_room_id,
  bananas_room_id,
  interactions_room_id,
} = process.env;

global.Olm = require("olm");

const sdk = require("matrix-js-sdk");

const localStorage = global.localStorage;
const {
  LocalStorageCryptoStore,
} = require("matrix-js-sdk/lib/crypto/store/localStorage-crypto-store");

async function startApp() {
  //create client
  const client = await sdk.createClient(matrix_server);

  console.log("client created");

  try {
    await client.loginWithPassword(bot_username, bot_password);
  } catch (e) {
    console.log(e);
  }

  console.log("starting client");
  await client.startClient({ initialSyncLimit: 10 });

  console.log("logging in");

  //load messages
  console.log("loading rooms");
  const rooms = await client.getRooms();

  const whatsappRoomId = whatsapp_room_id;

  //client.sendTextMessage(whatsappRoomId, "open 120363041992237057");

  const rooms2 = client.getRooms();

  console.log("rooms", rooms2);

  //add event handler for messages, this is the part that does the whatsapp bridging

  /*
client.on("event",(event)=>{
    console.log(event)
});
*/

  rooms2.forEach((room) => {
    console.log(room.room_id);
  });

  const activeRooms = {
    Apples: apples_room_id,
    Bananas: bananas_room_id,
    Interactions: interactions_room_id,
  };

  console.log(activeRooms);

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
    });
  };

  client.once("sync", async (state, prevState, res) => {
    // state will be 'PREPARED' when the client is ready to use
    console.log(state);
    checkRooms();
  });

  const scriptStart = Date.now();

  client.on("Room.timeline", function (event, room, toStartOfTimeline) {
    console.log(event.getType());
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

    //need to find id of the newly created room that bridges the groups

    //console.log(event.event.content.body);
    //console.log(room);

    if (event.event.content.url) {
      console.log(event.event.content.url);

      const url = client.mxcUrlToHttp(event.event.content.url, 100, 100);

      console.log(url);
    }

    /*
    if (event.event.sender != "@wobbly-bot:wobbly.app")
      client.sendTextMessage(event.event.room_id, "hello to you too");
      */
  });
}

startApp();
