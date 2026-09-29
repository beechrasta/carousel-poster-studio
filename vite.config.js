import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { spawn } from 'child_process';
import os from 'os';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'opencode-api-bridge',
      configureServer(server) {
        // Run Opencode inference
        server.middlewares.use('/api/opencode', (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
          }

          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });

          req.on('end', () => {
            try {
              const data = JSON.parse(body || '{}');
              const prompt = data.prompt;
              const model = data.model;

              if (!prompt) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Prompt is required' }));
                return;
              }

              // Run opencode isolated in temp directory with --pure so it acts strictly as an LLM copywriter
              // and does not crawl or grep the workspace codebase.
              const args = ['run', '--pure', '--dir', os.tmpdir()];
              if (model) {
                args.push('-m', model);
              }

              const child = spawn('opencode.cmd', args, {
                shell: true,
                windowsHide: true,
                stdio: ['pipe', 'pipe', 'pipe']
              });

              // Pipe prompt via standard input to bypass Windows shell argument length & character escaping limits
              child.stdin.write(prompt);
              child.stdin.end();

              let stdout = '';
              let stderr = '';

              child.stdout.on('data', d => {
                stdout += d.toString();
              });

              child.stderr.on('data', d => {
                stderr += d.toString();
              });

              child.on('close', code => {
                res.setHeader('Content-Type', 'application/json');
                const outTrimmed = stdout.trim();
                const errTrimmed = stderr.trim();

                if (code !== 0 && !outTrimmed) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({
                    error: `Opencode process exited with code ${code}`,
                    stderr: errTrimmed || 'Model execution failed',
                  }));
                } else {
                  res.statusCode = 200;
                  res.end(JSON.stringify({
                    output: outTrimmed || errTrimmed,
                    exitCode: code
                  }));
                }
              });

              child.on('error', err => {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: err.message }));
              });
            } catch (err) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
            }
          });
        });

        // Check Opencode CLI installation
        server.middlewares.use('/api/check-opencode', (req, res) => {
          const child = spawn('opencode', ['--version'], { shell: true, windowsHide: true });
          let out = '';
          child.stdout.on('data', d => out += d.toString());
          child.on('close', code => {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = code === 0 ? 200 : 500;
            res.end(JSON.stringify({ available: code === 0, version: out.trim() }));
          });
          child.on('error', () => {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 500;
            res.end(JSON.stringify({ available: false }));
          });
        });

        // Dynamic Opencode Models Discovery
        server.middlewares.use('/api/opencode-models', (req, res) => {
          const child = spawn('opencode', ['models'], { shell: true, windowsHide: true });
          let out = '';
          let errOut = '';
          child.stdout.on('data', d => out += d.toString());
          child.stderr.on('data', d => errOut += d.toString());

          child.on('close', code => {
            res.setHeader('Content-Type', 'application/json');
            if (code !== 0 && !out.trim()) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed to fetch models', stderr: errOut.trim() }));
              return;
            }

            const rawLines = out.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
            const models = [];
            const providersSet = new Set();
            const grouped = {};

            for (const line of rawLines) {
              // Valid model entries usually have a slash e.g. "cursor/claude-sonnet-4-5" or "openai/gpt-4o"
              if (line.includes('/')) {
                models.push(line);
                const parts = line.split('/');
                const provider = parts[0];
                providersSet.add(provider);
                if (!grouped[provider]) grouped[provider] = [];
                grouped[provider].push(line);
              }
            }

            res.statusCode = 200;
            res.end(JSON.stringify({
              count: models.length,
              models,
              providers: Array.from(providersSet),
              grouped
            }));
          });

          child.on('error', (err) => {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          });
        });

        // Dynamic Opencode Providers Discovery
        server.middlewares.use('/api/opencode-providers', (req, res) => {
          const child = spawn('opencode', ['providers', 'list'], { shell: true, windowsHide: true });
          let out = '';
          child.stdout.on('data', d => out += d.toString());
          child.on('close', code => {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify({ output: out.trim(), success: code === 0 }));
          });
          child.on('error', (err) => {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          });
        });
      }
    }
  ],
  server: {
    port: 3000,
    open: false,
  }
});
