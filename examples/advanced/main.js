import { Uhlive } from "@uhlive/javascript-sdk";
import { identifier, token } from "./settings.js";

const uhlive = new Uhlive(identifier, token);

document.getElementById("connect").addEventListener("click", () => {
    uhlive.connect();
    console.log("Connected!");
});

document.getElementById("join").addEventListener("click", () => {
    uhlive
        .join("my-conversation-id")
        .onSegmentDecoded((segment) => {
            console.log("Segment decoded", segment);
        })
        .onSegmentNormalized((segment) => {
            console.log("Segment normalized", segment);
        })
        .onEntityFound("*", (entity) => {
            console.log("Entity found", entity);
        });
});

document.getElementById("disconnect").addEventListener("click", (payload) => {
    uhlive.disconnect().then(() => {
        console.log("Disconnected!");
    });
});
