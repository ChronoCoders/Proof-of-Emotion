const networkStartup = `
#!/bin/bash
# start-network.sh - Start EmotionalChain Network

echo "🧠 Starting EmotionalChain Network"
echo "================================="

# Start bootstrap node
echo "🚀 Starting bootstrap node..."
npm run bootstrap 8000 &
BOOTSTRAP_PID=$!

# Wait for bootstrap to initialize
sleep 5

# Start validators
echo "👑 Starting validators..."
npm run validator validator1 8001 &
VALIDATOR1_PID=$!

sleep 2

npm run validator validator2 8002 &
VALIDATOR2_PID=$!

sleep 2

npm run validator validator3 8003 &
VALIDATOR3_PID=$!

echo "✅ Network started successfully!"
echo "📊 Network status:"
echo "   Bootstrap node: localhost:8000 (PID: $BOOTSTRAP_PID)"
echo "   Validator 1:    localhost:8001 (PID: $VALIDATOR1_PID)"
echo "   Validator 2:    localhost:8002 (PID: $VALIDATOR2_PID)"
echo "   Validator 3:    localhost:8003 (PID: $VALIDATOR3_PID)"
echo ""
echo "🎮 To interact with the network:"
echo "   npm run wallet"
echo ""
echo "🛑 To stop the network:"
echo "   ./stop-network.sh"

# Create PID file for shutdown script
echo "$BOOTSTRAP_PID" > .network.pids
echo "$VALIDATOR1_PID" >> .network.pids
echo "$VALIDATOR2_PID" >> .network.pids
echo "$VALIDATOR3_PID" >> .network.pids
`;
