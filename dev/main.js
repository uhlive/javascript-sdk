import Keycloak from "keycloak-js"
import { Uhlive } from "@uhlive/javascript-sdk";
import { uhliveConfig, keycloakConfig } from "./settings.js";

window.onload = () => {
  const keycloak = new Keycloak(keycloakConfig);
  keycloak.init({
    onLoad: "login-required",
    checkLoginIframe: false,
  }).then(function (authenticated) {
    if (authenticated) {
      const uhlive = new Uhlive({
        identifier: keycloak.tokenParsed.azp,
        jwtToken: keycloak.token,
        url: uhliveConfig.url
      });

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
          .onSegmentNormalized((segment) => {
            console.log("dev.segment_normalized", segment);
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
    }
  }).catch(function (e) {
    console.error("failed to initialize", e)
  });
};
