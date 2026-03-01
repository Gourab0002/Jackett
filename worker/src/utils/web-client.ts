export interface WebRequest {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  cookies?: string;
  encoding?: string;
  type?: 'GET' | 'POST';
}

export interface WebResult {
  status: number;
  headers: Record<string, string>;
  contentString: string;
  contentBytes?: ArrayBuffer;
  cookies?: string;
  redirectUrl?: string;
}

export async function fetchUrl(request: WebRequest): Promise<WebResult> {
  const method = request.type ?? request.method ?? 'GET';

  const headers = new Headers(request.headers);
  if (request.cookies) {
    headers.set('Cookie', request.cookies);
  }

  const init: RequestInit = {
    method,
    headers,
    redirect: 'follow',
  };

  if (method === 'POST' && request.body != null) {
    init.body = request.body;
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/x-www-form-urlencoded');
    }
  }

  const response = await fetch(request.url, init);

  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });

  const cookies = response.headers.get('set-cookie') ?? undefined;
  const redirectUrl = response.redirected ? response.url : undefined;

  const contentBytes = await response.arrayBuffer();
  const decoder = new TextDecoder(request.encoding ?? 'utf-8');
  const contentString = decoder.decode(contentBytes);

  return {
    status: response.status,
    headers: responseHeaders,
    contentString,
    contentBytes,
    cookies,
    redirectUrl,
  };
}
