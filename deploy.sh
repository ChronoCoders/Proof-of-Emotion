const deploymentScripts = `
#!/bin/bash
# deploy.sh - EmotionalChain Deployment Script

echo "🧠 EmotionalChain Deployment Script"
echo "=================================="

# Build the project
echo "📦 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

# Run tests
echo "🧪 Running tests..."
npm test

if [ $? -ne 0 ]; then
    echo "❌ Tests failed!"
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p data/blockchain
mkdir -p data/wallet
mkdir -p data/logs
mkdir -p data/validators

# Set permissions
chmod 755 data/
chmod 755 data/blockchain/
chmod 755 data/wallet/
chmod 755 data/logs/
chmod 755 data/validators/

# Copy configuration files
echo "⚙️  Setting up configuration..."
cp .env.example .env
echo "✏️  Please edit .env file with your configuration"

# Build Docker images
if command -v docker &> /dev/null; then
    echo "🐳 Building Docker image..."
    docker build -t emotional-chain:latest .
    
    if [ $? -eq 0 ]; then
        echo "✅ Docker image built successfully!"
    else
        echo "❌ Docker build failed!"
    fi
fi

echo "✅ Deployment preparation complete!"
echo ""
echo "🚀 To start the network:"
echo "   Single node: npm start"
echo "   Multi-node:  docker-compose up"
echo "   Validator:   npm run validator <id> <port>"
echo "   Bootstrap:   npm run bootstrap <port>"
`;