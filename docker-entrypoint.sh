#!/bin/sh
set -e

wait_for_tcp() {
  host="$1"
  port="$2"
  label="$3"

  echo "Waiting for $label at $host:$port..."

  until node -e "const net = require('net'); const socket = net.createConnection({ host: process.argv[1], port: Number(process.argv[2]) }); socket.on('connect', () => { socket.end(); process.exit(0); }); socket.on('error', () => process.exit(1));" "$host" "$port"
  do
    sleep 1
  done
}

wait_for_tcp "${DB_HOST:-db}" "${DB_PORT:-5432}" "PostgreSQL"
wait_for_tcp "rabbitmq" "5672" "RabbitMQ"

exec "$@"