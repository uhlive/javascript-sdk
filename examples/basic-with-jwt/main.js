import Keycloak from "keycloak-js"
import { Uhlive } from "@uhlive/javascript-sdk";
import { identifier, url } from "./settings.js";

window.onload = () => {
    const keycloak = new Keycloak(
        {
            url: "https://id.uh.live",
            realm: "production",
            clientId: "you-client-id"
        }
    );
    keycloak.init({
        onLoad: "login-required",
    }).then(function (authenticated) {
        if (authenticated) {
            keycloak.loadUserProfile().then((user) => console.log("user:", user));
            console.log("keycloak.token:", keycloak.token)
            const uhlive = new Uhlive(identifier, keycloak.token, { url });
            uhlive
                .connect()
                .join("my-conversation-id");
        }
    }).catch(function (e) {
        console.error("failed to initialize", e)
    });
};
