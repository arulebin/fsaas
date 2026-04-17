const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// In-memory data store for MVP speed
const factories = [
  { id: 1, name: "Alpha Factory", location: "New York", capacity: 100, available: true, lat: 40.7128, lon: -74.0060 },
  { id: 2, name: "Beta Factory", location: "Los Angeles", capacity: 50, available: true, lat: 34.0522, lon: -118.2437 },
  { id: 3, name: "Gamma Factory", location: "Chicago", capacity: 200, available: true, lat: 41.8781, lon: -87.6298 },
];

const orders = [];

// 1. Upload Product Requirements (Create Order)
app.post('/api/orders', (req, res) => {
  const { productName, quantity, requirements, clientLat, clientLon } = req.body;
  
  if (!productName || !quantity) {
    return res.status(400).json({ error: "Missing required fields (productName, quantity)" });
  }

  const newOrder = {
    id: orders.length + 1,
    productName,
    quantity,
    requirements: requirements || {},
    clientLocation: { lat: clientLat || 0, lon: clientLon || 0 }, // For location logic
    status: 'pending',
    assignedFactoryId: null
  };
  
  orders.push(newOrder);
  res.status(201).json({ message: "Order created successfully", order: newOrder });
});

// 2. Find Nearest/Available Factory & Assign Production (Scheduling/Allocation)
app.post('/api/orders/:id/assign', (req, res) => {
  const orderId = parseInt(req.params.id);
  const order = orders.find(o => o.id === orderId);

  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  if (order.status !== 'pending') {
      return res.status(400).json({ error: "Order is already assigned or completed" });
  }

  // MVP scheduling heuristic: Find available factory with capacity, sort by "nearest" (mock distance)
  // Distance calculation (Euclidean mock for MVP instead of Haversine)
  const availableFactories = factories
    .filter(f => f.available && f.capacity >= order.quantity)
    .map(f => {
      const dist = Math.sqrt(
        Math.pow(f.lat - order.clientLocation.lat, 2) + Math.pow(f.lon - order.clientLocation.lon, 2)
      );
      return { ...f, dist };
    })
    .sort((a, b) => a.dist - b.dist);

  if (availableFactories.length === 0) {
    return res.status(400).json({ error: "No available factory found with sufficient capacity" });
  }

  const selectedFactory = availableFactories[0];
  const factoryRef = factories.find(f => f.id === selectedFactory.id);

  // Allocate resource / assign production
  order.assignedFactoryId = factoryRef.id;
  order.status = 'assigned';
  
  factoryRef.capacity -= order.quantity;
  if (factoryRef.capacity <= 0) {
      factoryRef.available = false; // Mark unavailable if capacity exhausted
  }

  res.json({
    message: "Production assigned successfully",
    order,
    factory: {
        id: factoryRef.id,
        name: factoryRef.name,
        location: factoryRef.location,
        remainingCapacity: factoryRef.capacity
    }
  });
});

// MVP State Check (To visualize everything quickly)
app.get('/api/state', (req, res) => {
  res.json({ factories, orders });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`FaaS Backend MVP running on port ${PORT}`);
});
