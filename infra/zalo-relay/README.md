# Zalo profile relay

Zalo returns personal info (`-501 ... IP address not inside Vietnam`) only to callers with a
Vietnam IP. The commerce API runs on Vercel (US), so it asks this relay — running on server103
(Hanoi, `103.170.122.24`) — to fetch the Zalo profile for a user's access token.

- `GET /zalo/me?fields=id,name` with headers `x-relay-secret` and `x-zalo-access-token`
- Only known fields, only that path; stores nothing; holds no Zalo app secret.
- Reached at `https://zalo-relay.droneviet.vn` through a Cloudflare Tunnel (no inbound ports).
- The API uses it when `ZALO_PROFILE_RELAY_URL` and `ZALO_PROFILE_RELAY_SECRET` are set.

Deploy on server103 (`ssh server103`, root): copy this folder to `~/droneviet-zalo-relay`, create `.env`
(`RELAY_SECRET`, `TUNNEL_TOKEN`, chmod 600), then `docker compose up -d --build`. Any Vietnam-IP Docker host works; a second host can run the same
compose project and the tunnel will load-balance between them.
Secrets live in the macOS Keychain: `DRONEVIET_ZALO_RELAY_SECRET`, `DRONEVIET_ZALO_RELAY_TUNNEL_TOKEN`.
