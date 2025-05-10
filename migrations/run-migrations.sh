#!/bin/bash

# Wait for MongoDB to be ready
echo "Waiting for MongoDB to be ready..."
until mongosh --host mongodb --port 27017 -u $MONGO_ROOT_USERNAME -p $MONGO_ROOT_PASSWORD --authenticationDatabase admin --eval "db.adminCommand('ping')" > /dev/null 2>&1; do
  echo "MongoDB is unavailable - sleeping"
  sleep 1
done

echo "MongoDB is up - executing migrations"

# Get current version
CURRENT_VERSION=$(mongosh --host mongodb --port 27017 -u $MONGO_ROOT_USERNAME -p $MONGO_ROOT_PASSWORD --authenticationDatabase admin $MONGO_DB --eval "db.migrations.findOne({}, {sort: {version: -1}}).version" --quiet)
CURRENT_VERSION=${CURRENT_VERSION:-0}
echo "Current database version: $CURRENT_VERSION"

# Run all migration files in order
for migration in /migrations/versions/*.js; do
  # Extract version number from filename
  VERSION=$(basename "$migration" | cut -d'_' -f1)
  NAME=$(basename "$migration" | cut -d'_' -f2- | sed 's/\.js$//')
  
  if [ "$VERSION" -gt "$CURRENT_VERSION" ]; then
    echo "Applying migration: $VERSION - $NAME"
    mongosh --host mongodb --port 27017 -u $MONGO_ROOT_USERNAME -p $MONGO_ROOT_PASSWORD --authenticationDatabase admin $MONGO_DB $migration
    
    # Record the migration
    mongosh --host mongodb --port 27017 -u $MONGO_ROOT_USERNAME -p $MONGO_ROOT_PASSWORD --authenticationDatabase admin $MONGO_DB --eval "db.migrations.insertOne({version: $VERSION, name: '$NAME', appliedAt: new Date()})" --quiet
    
    echo "✓ Migration $VERSION completed"
  else
    echo "Skipping migration $VERSION - $NAME (already applied)"
  fi
done

echo "All migrations completed" 