FROM alpine:3.21
RUN apk add --no-cache curl
COPY docker/cron-sync/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
CMD ["/entrypoint.sh"]
