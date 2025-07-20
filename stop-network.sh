const networkShutdown = `
#!/bin/bash
# stop-network.sh - Stop EmotionalChain Network

echo "🛑 Stopping EmotionalChain Network"
echo "================================="

if [ -f .network.pids ]; then
    echo "📋 Reading process IDs..."
    while read pid; do
        if ps -p $pid > /dev/null; then
            echo "🔪 Stopping process $pid..."
            kill $pid
        fi
    done < .network.pids
    
    # Wait for graceful shutdown
    sleep 3
    
    # Force kill if necessary
    while read pid; do
        if ps -p $pid > /dev/null; then
            echo "💀 Force killing process $pid..."
            kill -9 $pid
        fi
    done < .network.pids
    
    rm .network.pids
    echo "✅ Network stopped successfully!"
else
    echo "⚠️  No PID file found. Attempting to kill all node processes..."
    pkill -f "emotional-chain"
    pkill -f "validator-node"
    pkill -f "bootstrap-node"
fi

echo "🧹 Cleanup complete!"
`;

// 12. Testing Configuration (jest.config.js)
const jestConfig = `
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/*.(test|spec).+(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(ts|tsx): 'ts-jest'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 10000
};
`;
