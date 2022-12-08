import Keycloak from "keycloak-js"
import { Uhlive } from "@uhlive/javascript-sdk";
import { keycloakConfig } from "./settings.js";

window.onload = () => {
    const keycloak = new Keycloak(keycloakConfig);
    keycloak.init({
        onLoad: "login-required",
        checkLoginIframe: false,
    }).then(function (authenticated) {
        if (
            authenticated
            && "stream-h2h" in keycloak.resourceAccess
            && keycloak.resourceAccess["stream-h2h"].roles.includes("read")
            && keycloak.resourceAccess["stream-h2h"].roles.includes("write")
        ) {
            const uhlive = new Uhlive({
                identifier: keycloak.tokenParsed.azp,
                jwtToken: keycloak.token,
            });

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
        } else {
            console.error("You're not authorized to use the stream-h2h API.")
        }
    }).catch(function (e) {
        console.error("failed to initialize", e)
    });
};
