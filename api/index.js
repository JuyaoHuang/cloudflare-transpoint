// 文件路径: api/index.js

export const config = {
  runtime: 'edge', // 必须开启 Edge Runtime 以支持流式传输
  // regions: ['sin1'], // 可选：指定新加坡节点 (离国内近)，或者不写让它自动选择
};

export default async function handler(request) {
  const url = new URL(request.url);

  // 1. 健康检查：防止浏览器直接访问报错
  if (url.pathname === '/' || url.pathname === '/index.html') {
    return new Response('AnyRouter Proxy on Vercel is Active.', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
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
  
  // 移除 Vercel 标记，防止被上游识别
  headers.delete('x-vercel-id');
  headers.delete('x-vercel-deployment-url');
  headers.delete('x-forwarded-for');
  headers.delete('x-real-ip');

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: request.body,
      redirect: 'manual',
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
