export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // 目标指向 AnyRouter 官方 API
   const targetUrl = new URL('https://anyrouter.top' + url.pathname + url.search);

    // 构造请求
    const newRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: 'follow'
    });

    try {
      const response = await fetch(newRequest);
      
      // 创建新响应，允许跨域（虽然CLI通常不需要，但以防万一）
      const newResponse = new Response(response.body, response);
      newResponse.headers.set('Access-Control-Allow-Origin', '*');
      
      return newResponse;
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }
};