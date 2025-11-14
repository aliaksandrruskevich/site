 #!/bin/bash

# Deploy script for Fattoria.by website
# Usage: ./deploy.sh [environment]

ENVIRONMENT=${1:-production}
PROJECT_DIR="/home/fattoriaby"
BACKUP_DIR="/var/backups/fattoria"

echo "🚀 Starting deployment to $ENVIRONMENT environment..."

# Create backup
echo "📦 Creating backup..."
mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).tar.gz -C $PROJECT_DIR .

# Stop current server
echo "🛑 Stopping current server..."
pm2 stop fattoria-website || true
pm2 delete fattoria-website || true

# Update code
echo "📥 Updating code..."
cd $PROJECT_DIR
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production

# Run database migrations if needed
echo "🗄️ Checking database..."
# Add your database migration commands here

# Start server
echo "🚀 Starting server..."
pm2 start ultra-server.js --name "fattoria-website"
pm2 startup
pm2 save

# Health check
echo "🔍 Running health check..."
sleep 5
curl -f http://localhost:3000/ > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🌐 Site is running at http://localhost:3000"
else
    echo "❌ Health check failed!"
    exit 1
fi

# Cleanup old backups (keep last 10)
echo "🧹 Cleaning up old backups..."
cd $BACKUP_DIR
ls -t *.tar.gz | tail -n +11 | xargs rm -f

echo "🎉 Deployment completed successfully!"
