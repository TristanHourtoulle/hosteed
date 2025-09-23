# Redis Caching - Development Setup

Quick setup guide for enabling Redis caching in development.

## 🚀 Quick Start (5 minutes)

### 1. Install Redis

**macOS (Homebrew):**
```bash
brew install redis
brew services start redis
```

**Docker (Recommended):**
```bash
docker run -d --name hosteed-redis -p 6379:6379 redis:alpine
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis-server
```

### 2. Configure Environment

Add to your `.env` file:

```env
# Enable Redis caching
ENABLE_REDIS_CACHE=true

# Redis connection
REDIS_URL=redis://localhost:6379

# Cache TTL settings (optional - defaults provided)
CACHE_TTL_PRODUCT_SEARCH=300
CACHE_TTL_STATIC_DATA=86400
CACHE_TTL_USER_SESSION=3600
```

### 3. Verify Setup

```bash
# Start the application
pnpm dev

# Test Redis connection
curl http://localhost:3000/api/cache/health

# Should return healthy status
```

## 🧪 Testing Cache Performance

### Check Cache Status
```bash
# Health check
curl http://localhost:3000/api/cache/health | jq

# Detailed metrics  
curl http://localhost:3000/api/cache/metrics | jq

# Performance test
curl -X POST http://localhost:3000/api/cache/performance | jq
```

### Verify Caching is Working

1. **Search Performance Test:**
```bash
# First request (cache miss)
time curl "http://localhost:3000/api/products/search?q=villa"

# Second request (cache hit) - should be much faster
time curl "http://localhost:3000/api/products/search?q=villa"
```

2. **Static Data Test:**
```bash
# Check equipment loading
time curl "http://localhost:3000/api/equipments"

# Second request should be instant
time curl "http://localhost:3000/api/equipments"
```

3. **Monitor Cache Headers:**
```bash
curl -I "http://localhost:3000/api/products/search?q=villa"
# Look for: X-Cache: HIT or X-Cache: MISS
```

## 🔧 Development Tools

### Redis CLI Commands

```bash
# Connect to Redis
redis-cli

# Monitor all commands
redis-cli monitor

# Check memory usage
redis-cli info memory

# List all keys
redis-cli keys "*"

# Get cache stats
redis-cli info stats
```

### Useful Cache Operations

```bash
# Clear specific cache
redis-cli del "search:villa:*"

# Clear all cache
redis-cli flushall

# Check TTL of a key
redis-cli ttl "product:123"

# Get cache size
redis-cli dbsize
```

### Debug Cache Issues

```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# Check application logs
tail -f logs/development.log | grep -i redis

# Monitor cache hit/miss ratio
watch -n 2 'curl -s http://localhost:3000/api/cache/metrics | jq ".performance.hitRate"'
```

## 📊 Expected Performance Improvements

| Operation | Without Cache | With Cache | Improvement |
|-----------|---------------|------------|-------------|
| Product Search | ~800ms | ~80ms | **90%** |
| Equipment List | ~200ms | ~10ms | **95%** |
| Availability Check | ~300ms | ~30ms | **90%** |

## 🐛 Common Issues

### Redis Connection Failed
```bash
# Check if Redis is running
brew services list | grep redis
# or
docker ps | grep redis

# Restart Redis
brew services restart redis
# or  
docker restart hosteed-redis
```

### Low Cache Hit Rate
- Clear cache and test with fresh data
- Check TTL values are appropriate
- Verify cache keys are being generated correctly

### Memory Issues
```bash
# Check Redis memory usage
redis-cli info memory | grep used_memory_human

# Set memory limit (if needed)
redis-cli config set maxmemory 100mb
```

## ⚡ Pro Tips

1. **Use Redis Desktop Manager** for visual cache inspection
2. **Monitor cache hit rates** during development
3. **Test cache invalidation** when updating data
4. **Use different Redis DB numbers** for different environments:
   ```env
   REDIS_DB=0  # Development
   REDIS_DB=1  # Testing
   REDIS_DB=2  # Staging
   ```

## 🔄 Disable Caching

To temporarily disable caching:

```env
ENABLE_REDIS_CACHE=false
```

The application will work normally without caching (with slower performance).

## 📈 Monitor Development Performance

```bash
# Watch cache health in real-time
watch -n 5 'curl -s http://localhost:3000/api/cache/health | jq ".summary"'

# Monitor hit rate
watch -n 2 'curl -s http://localhost:3000/api/cache/metrics | jq ".performance.hitRate"'

# Track memory usage
watch -n 10 'redis-cli info memory | grep used_memory_human'
```

---

That's it! You now have Redis caching enabled in development. You should see dramatic performance improvements in API response times. 🚀