import { Uhlive } from "@uhlive/javascript-sdk";
import { identifier, token } from "./settings.js";

const uhlive = new Uhlive(identifier, token);
uhlive
    .connect()
    .join("my-conversation-id");
