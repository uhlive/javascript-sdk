import Keycloak from "keycloak-js"
import { Uhlive } from "@uhlive/javascript-sdk";
import { uhliveConfig, keycloakConfig } from "./settings.js";

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
                url: uhliveConfig.url
            });
            uhlive
                .connect()
                .join("my-conversation-id");
        } else {
            console.error("You're not authorized to use the stream-h2h API.")
        }
    }).catch(function (e) {
        console.error("failed to initialize", e)
    });
};
