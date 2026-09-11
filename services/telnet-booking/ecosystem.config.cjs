module.exports = {
  apps: [
    {
      name: "portfolio-telnet-booking",
      cwd: __dirname,
      script: "server.mjs",
      interpreter: "node",
      autorestart: true,
      max_memory_restart: "128M",
      env: {
        NODE_ENV: "production",
        TELNET_HOST: "0.0.0.0",
        TELNET_PORT: "2323",
      },
    },
  ],
}
