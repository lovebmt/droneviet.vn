import { createRelayServer } from "./relay.mjs";

const port = Number(process.env.PORT ?? 8080);

// Deliberately no request logging of headers: they carry the relay secret and user tokens.
createRelayServer({ secret: process.env.RELAY_SECRET ?? "" }).listen(port, () => {
  console.log(`zalo-relay listening on :${port}`);
});
