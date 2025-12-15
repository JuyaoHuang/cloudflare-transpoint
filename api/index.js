// api/index.js
export const config = {
  runtime: 'edge', // 必须使用 Edge Runtime，速度快且支持流式传输
};

export default async function handler(request) {
  const url = new URL(request.url);

  // 1. 拦截浏览器根目录访问 (防止你自己测试时晕头转向)
  if (url.pathname === '/' || url.pathname === '/index.html') {
    return new Response('AnyRouter Vercel Proxy is Active. \nPlease set ANTHROPIC_BASE_URL to https://atri.juayohuang.top', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  // 2. 定义上游 (AnyRouter)
  // 根据你的情报，Base URL 是 anyrouter.top
  const UPSTREAM_HOST = 'anyrouter.top';
  const UPSTREAM_URL = `https://${UPSTREAM_HOST}`;
  
  // 3. 构造目标 URL
  const targetUrl = new URL(url.pathname + url.search, UPSTREAM_URL);

  // 4. 清洗 Headers (关键)
  const headers = new Headers(request.headers);
  headers.set('Host', UPSTREAM_HOST);
  headers.set('Referer', `https://${UPSTREAM_HOST}/`);
  // 移除 Vercel 特有头部，伪装成普通请求
  headers.delete('x-vercel-id');
  headers.delete('x-vercel-deployment-url');
  headers.delete('x-forwarded-for');

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: request.body,
      redirect: 'manual', // 禁止自动重定向
    });

    // 5. 返回响应
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Proxy Error', details: e.message }), { status: 500 });
  }
}