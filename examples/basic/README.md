# uhlive-example-basic

This example loads the `@uhlive/javascript-sdk` package and immediately starts
to listen to your microphone and inject the transcript in the DOM.

This is done thanks to the presence of the `<div id="uhlive"></div>` HTML tag.
The id of the tag in which the transcript is injected can be changed with the
`wrapper` option when joining a conversation:

```javascript
const uhlive = new Uhlive("my-identifier", "my-token");
uhlive
    .connect()
    .join("my-conversation", {
        wrapper: "my-custom-wrapper",
    });
```

Try the example with:

```bash
npm install
npm run dev
```

Then go to <http://localhost:3000> and allow access to microphone
