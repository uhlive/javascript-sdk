import { Uhlive } from "@uhlive/javascript-sdk";
import { identifier, token } from "./settings.js";

const uhlive = new Uhlive(identifier, token, {url: "wss://preprod-api.uh.live/"});

document.getElementById("connect").addEventListener("click", () => {
  uhlive.connect();
  console.log("dev.connected");
});

document.getElementById("join").addEventListener("click", () => {
  uhlive
    .join("my-conversation-id")
    .onWordsDecoded((segment) => {
      console.log("dev.words_decoded", segment);
    })
    .onSegmentDecoded((segment) => {
      console.log("dev.segment_decoded", segment);
    })
    .onEntityFound("*", (entity, entityName) => {
      console.log("dev.entityFound.*", entityName, entity);
    })
    .onEntityFound("LocationCity", (entity, entityName) => {
      console.log("dev.entityFound.LocationCity", entityName, entity);
    })
    .onTagsFound((payload) => {
      console.log("dev.tags_found", payload.annotation.tags.map(t => t.label));
    });
});

document.getElementById("leave").addEventListener("click", () => {
  uhlive.leave().then(() => {
    console.log("dev.conversation_left");
  });
});

document.getElementById("disconnect").addEventListener("click", (payload) => {
  uhlive.disconnect().then(() => {
    console.log("dev.disconnected");
  });
});
