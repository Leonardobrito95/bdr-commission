import { Request, Response } from 'express';
import axios from 'axios';
import https from 'https';

// IPs internos que devem ser roteados via proxy
const INTERNAL_PATTERNS = [
  /^https?:\/\/192\.168\./,
  /^https?:\/\/10\./,
  /^https?:\/\/172\.(1[6-9]|2\d|3[01])\./,
  /^https?:\/\/localhost/,
  /^https?:\/\/127\.0\.0\.1/,
];

export function isInternalUrl(url: string): boolean {
  return INTERNAL_PATTERNS.some(p => p.test(url));
}

export async function proxyRequest(req: Request, res: Response) {
  const raw = req.query.url as string;
  if (!raw) {
    res.status(400).json({ message: 'Parâmetro url obrigatório.' });
    return;
  }

  let targetUrl: string;
  try {
    targetUrl = decodeURIComponent(raw);
  } catch {
    res.status(400).json({ message: 'URL inválida.' });
    return;
  }

  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    res.status(400).json({ message: 'URL deve começar com http:// ou https://' });
    return;
  }

  try {
    const agent = new https.Agent({ rejectUnauthorized: false });
    const response = await axios.get(targetUrl, {
      responseType: 'arraybuffer',
      timeout: 30_000,
      httpsAgent: agent,
      maxRedirects: 5,
    });

    const contentType = response.headers['content-type'] ?? 'text/html';
    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'no-cache');
    res.set('X-Frame-Options', 'SAMEORIGIN');
    res.status(response.status).send(response.data);
  } catch (err: any) {
    const status = err.response?.status ?? 502;
    res.status(status).json({ message: `Erro ao conectar ao destino: ${err.message}` });
  }
}
