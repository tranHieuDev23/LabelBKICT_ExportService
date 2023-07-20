# This command helps delete expired exports in the database every hour.
0 */1 * * * /usr/local/bin/node /build/dist/main.js --delete_expired_exports
