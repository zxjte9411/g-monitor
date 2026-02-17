import http from 'http';
import { URL } from 'url';

export interface CallbackServer {
  port: number;
  waitForCode: () => Promise<{ code: string; state: string | null }>;
  close: () => void;
}

export function startCallbackServer(): Promise<CallbackServer> {
  return new Promise((resolve, reject) => {
    const server = http.createServer();
    let codePromise: Promise<{ code: string; state: string | null }>;
    let resolveCode: (result: { code: string; state: string | null }) => void;
    let rejectCode: (err: Error) => void;

    codePromise = new Promise((res, rej) => {
      resolveCode = res;
      rejectCode = rej;
    });

    server.on('request', (req, res) => {
      const url = new URL(req.url || '', `http://localhost:${(server.address() as any).port}`);

      if (url.pathname !== '/') {
        res.statusCode = 404;
        res.end();
        return;
      }

      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const error = url.searchParams.get('error');

      if (error) {
        res.end(`Authentication failed: ${error}. You can close this window.`);
        rejectCode(new Error(`Authentication failed: ${error}`));
        return;
      }
      
      if (code) {
        res.end('Authentication successful! You can close this window.');
        resolveCode({ code, state });
      } else {
        res.end('Authentication failed: No code found in response. You can close this window.');
        rejectCode(new Error('No code found in callback URL'));
      }
    });

    server.listen(0, '127.0.0.1', () => {
      const port = (server.address() as any).port;
      resolve({
        port,
        waitForCode: () => codePromise,
        close: () => server.close()
      });
    });
  });
}
