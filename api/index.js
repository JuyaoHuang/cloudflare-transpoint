// 文件路径: api/index.js

export const config = {
  runtime: 'edge',
  regions: ['hkg1', 'sin1'], // 优先使用香港和新加坡节点
};

export default async function handler(request) {
  const url = new URL(request.url);

  // 1. 健康检查
  if (url.pathname === '/' || url.pathname === '/index.html') {
    return new Response('AnyRouter Proxy on Vercel is Active.', {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  // 2. 上游地址配置
  const UPSTREAM_HOST = 'anyrouter.top';
  const UPSTREAM_URL = `https://${UPSTREAM_HOST}`;

  // 3. 构造转发 URL
  const targetUrl = new URL(url.pathname + url.search, UPSTREAM_URL);

  // 4. 请求头处理
  const headers = new Headers(request.headers);
  headers.set('Host', UPSTREAM_HOST);
  headers.set('Referer', `https://${UPSTREAM_HOST}/`);

  // 移除 Vercel 标记
  headers.delete('x-vercel-id');
  headers.delete('x-vercel-deployment-url');
  headers.delete('x-forwarded-for');
  headers.delete('x-real-ip');

  // 5. 添加超时控制
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 50000); // 50秒超时

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: request.body,
      redirect: 'manual',
      signal: controller.signal,
      // 添加 keepalive 以支持长连接
      keepalive: true,
    });

    clearTimeout(timeoutId);

    // 6. 处理响应头，确保流式传输正常工作
    const responseHeaders = new Headers(response.headers);

    // 移除可能干扰流式传输的头
    responseHeaders.delete('content-length');

    // 确保正确的 CORS 头
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', '*');
    responseHeaders.set('Access-Control-Allow-Headers', '*');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (e) {
    clearTimeout(timeoutId);

    // 区分不同类型的错误
    if (e.name === 'AbortError') {
      return new Response(
        JSON.stringify({
          error: 'Request timeout',
          message: 'The upstream server took too long to respond'
        }),
        {
          status: 504,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: 'Proxy error',
        message: e.message,
        stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
      }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
