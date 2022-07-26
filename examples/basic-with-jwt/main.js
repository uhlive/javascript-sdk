import Keycloak from "keycloak-js"
import { Uhlive } from "@uhlive/javascript-sdk";
import { uhliveConfig, keycloakConfig} from "./settings.js";

window.onload = () => {
    const keycloak = new Keycloak(keycloakConfig);
    keycloak.init({
        onLoad: "login-required",
    }).then(function (authenticated) {
        if (authenticated) {
            const uhlive = new Uhlive({
                identifier: keycloak.tokenParsed.azp,
                jwtToken: keycloak.token,
                url: uhliveConfig.url
              });
            uhlive
                .connect()
                .join("my-conversation-id");
        }
    }).catch(function (e) {
        console.error("failed to initialize", e)
    });
};
