#!/bin/sh

echo "Starting container..."
cd /app
echo "Building application with runtime env..."
yarn build:web

echo "Starting server..."
node server.js
