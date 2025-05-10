FROM mongo:latest

# Install mongosh (MongoDB Shell)
RUN apt-get update && apt-get install -y wget gnupg \
    && wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | apt-key add - \
    && echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list \
    && apt-get update \
    && apt-get install -y mongodb-mongosh \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /migrations

# Copy migration files
COPY migrations/versions ./versions
COPY migrations/run-migrations.sh .

# Make the script executable
RUN chmod +x run-migrations.sh

# Run migrations
CMD ["./run-migrations.sh"] 