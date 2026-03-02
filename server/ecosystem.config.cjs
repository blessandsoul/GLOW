module.exports = {
  apps: [
    {
      name: 'glowge-server',
      script: 'dist/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
      // Graceful shutdown — matches SIGTERM handler in server.ts
      kill_timeout: 10000,
      listen_timeout: 15000,
      // Forward logs to stdout/stderr so Docker/Coolify captures them
      error_file: '/dev/stderr',
      out_file: '/dev/stdout',
      log_date_format: '',
    },
  ],
};
