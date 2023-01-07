# Build stage
FROM node:16.14.2-bullseye
# Install NodeJs dependencies
WORKDIR /build
COPY package.json ./
COPY package-lock.json ./
RUN npm install
RUN npm install -g pm2
# Build package
COPY . .
RUN npm run build
# Install cron
RUN apt-get update
RUN apt-get install -y cron
# Start the cronjob
RUN chmod 0644 deploy/cron.d
RUN crontab deploy/cron.d
RUN cron
# Start the server with 16 instances
ENV NODE_ENV=production
EXPOSE 20002
ENTRYPOINT ["sh", "./scripts/start_service.sh"]