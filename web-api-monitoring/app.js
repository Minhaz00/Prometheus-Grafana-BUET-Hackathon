const express = require('express');
const promClient = require('prom-client');

const app = express();
const port = 5000;

// Create a Registry to register the metrics
const register = new promClient.Registry();

// Create a histogram metric for HTTP request duration
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

// Create a counter metric for total requests
const totalRequests = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Register the metrics
register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(totalRequests);

// Middleware to collect metrics
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    httpRequestDurationMicroseconds
      .labels(req.method, req.path, res.statusCode)
      .observe(duration / 1000);
    totalRequests
      .labels(req.method, req.path, res.statusCode)
      .inc();
  });
  next();
});

// Routes
app.get('/login', (req, res) => {
  res.send('Login page');
});

app.get('/register', (req, res) => {
  res.send('Register page');
});

app.get('/home', (req, res) => {
  res.send('Home page');
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});