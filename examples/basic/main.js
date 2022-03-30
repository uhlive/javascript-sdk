import { Uhlive } from "@uhlive/javascript-sdk";
import { identifier, token, url } from "./settings.js";

const uhlive = new Uhlive(identifier, token, {url});
uhlive
    .connect()
    .join("my-conversation-id");
