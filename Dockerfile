# 使用官方 Nginx 镜像作为基础镜像
FROM nginx:1.25-alpine

# 设置维护者信息
LABEL maintainer="your-email@example.com"
LABEL description="AnyRouter Proxy with Nginx"

# 删除默认配置
RUN rm /etc/nginx/nginx.conf

# 复制自定义 Nginx 配置
COPY nginx.conf /etc/nginx/nginx.conf

# 创建日志目录
RUN mkdir -p /var/log/nginx && \
    chown -R nginx:nginx /var/log/nginx

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

# 暴露端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
