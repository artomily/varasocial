// PM2 ecosystem config (CommonJS — required even for ESM projects).
// Usage: pm2 start ecosystem.config.cjs
//        pm2 logs ai-validator
//        pm2 monit

module.exports = {
  apps: [
    {
      name: "ai-validator",
      script: "src/index.js",
      // Node 20+ supports ES modules natively; no extra flags needed.
      env: {
        NODE_ENV: "production",
      },
      // Restart policy
      max_restarts: 10,
      restart_delay: 5_000,
      min_uptime: "10s",
      // Log files (relative to project root)
      error_file: "logs/error.log",
      out_file: "logs/out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
  ],
};
