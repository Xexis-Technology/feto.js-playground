# Feto.js

A lightweight, dependency-free JavaScript HTTP client library built around native Fetch.

[🚀 Live Playground](https://fetojs.netlify.app/) · [📦 npm](https://www.npmjs.com/package/feto.js)

## What is Feto.js?

Feto.js is a minimal HTTP request library for browsers and Node.js. It provides a clean API for making HTTP requests with features like authentication, retry, timeout, interceptors, caching, and request deduplication — all without any external dependencies.

## Current Status

This is Feto.js v1.0.0 — a lightweight, dependency-free JavaScript HTTP client library built around native Fetch.

## Features

- All HTTP methods: GET, POST, PUT, PATCH, DELETE
- `Feto.create()` for reusable instances with default configuration
- Base URL support with safe URL combination
- Query parameter encoding with `params`
- Custom headers on any request
- Automatic JSON serialization for objects
- FormData support for file uploads
- Automatic JSON parsing of responses
- Bearer token authentication (global + instance-level)
- Request timeout with AbortController
- Clear error classification with metadata
- Automatic retry with fixed or exponential backoff
- Request and response interceptors (global + instance-level)
- Response caching with TTL (auth-aware)
- Request deduplication for GET (auth-aware)
- Request duration metadata
- TypeScript declarations
- Production-ready distribution builds

---

## Installation

```bash
npm install feto.js
```

### Local Browser Script

```html
<script src="./dist/feto.min.js"></script>
```

### ES Module

```javascript
import Feto from "./dist/feto.esm.js";
```

### CommonJS

```javascript
const Feto = require("feto.js");
```

### CDN

```html
<script src="https://unpkg.com/feto.js@1.0.0/dist/feto.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/feto.js@1.0.0/dist/feto.min.js"></script>
```

---

## Quick Start

```javascript
// Static API
const response = await Feto.get("https://api.example.com/users");
console.log(response.data);

// Instance API
const api = Feto.create({ baseURL: "https://api.example.com" });
const users = await api.get("/users");
console.log(users.data);
```

---

## Feto.create()

Create a reusable instance with default configuration:

```javascript
const api = Feto.create({
  baseURL: "https://api.example.com",
  headers: { "X-App-Version": "1.0" },
  timeout: 10000,
  retry: 2,
  retryDelay: 500,
  retryBackoff: "exponential",
  token: "my-token",
  cache: true,
  ttl: 30000
});
```

### Instance methods

```javascript
api.get(url, options)
api.post(url, data, options)
api.put(url, data, options)
api.patch(url, data, options)
api.delete(url, options)
```

Both the static API and instance API coexist:

```javascript
// Static
Feto.get("https://api.example.com/users");

// Instance
api.get("/users");
```

---

## Base URL

```javascript
const api = Feto.create({ baseURL: "https://api.example.com" });

api.get("/users");
// => https://api.example.com/users

api.get("https://other-api.com/data");
// => https://other-api.com/data (absolute URL, baseURL ignored)
```

---

## Query Parameters

```javascript
api.get("/users", {
  params: {
    page: 1,
    limit: 20,
    search: "bappi"
  }
});
// => /users?page=1&limit=20&search=bappi
```

- `null` and `undefined` values are skipped
- Existing query strings are preserved:
  ```javascript
  api.get("/users?sort=name", { params: { page: 2 } });
  // => /users?sort=name&page=2
  ```

---

## Default Configuration

Instance defaults are inherited by all requests:

```javascript
const api = Feto.create({
  baseURL: "https://api.example.com",
  headers: { "X-App-Version": "1.0" },
  timeout: 10000,
  retry: 2,
  retryDelay: 500,
  retryBackoff: "exponential"
});

// All requests use these defaults
api.get("/users");
```

---

## Configuration Precedence

Priority (highest to lowest):

1. Request options
2. Instance defaults
3. Library defaults

```javascript
const api = Feto.create({ timeout: 10000 });

api.get("/users", { timeout: 3000 });
// Final timeout: 3000ms
```

### Header merging

Headers merge rather than replace:

```javascript
const api = Feto.create({
  headers: { "X-App": "Feto", "X-Version": "1" }
});

api.get("/users", {
  headers: { "X-Request": "demo" }
});
// Final headers include all three
```

Request-specific headers override duplicate instance headers.

---

## Headers

```javascript
Feto.get("https://api.example.com/data", {
  headers: { "X-Custom": "value" }
});
```

---

## Authentication

### Global

```javascript
Feto.auth.setToken("abc123");
const response = await Feto.get("/profile");
// Automatically sends Authorization: Bearer abc123

Feto.auth.getToken(); // "abc123"
Feto.auth.clearToken();
```

### Instance-level

```javascript
const api = Feto.create({ token: "instance-token" });
await api.get("/users"); // Uses instance token

api.auth.setToken("new-token");
api.auth.getToken(); // "new-token"
api.auth.clearToken();
```

Instance auth is isolated from global auth.

---

## Timeout

```javascript
await Feto.get(url, { timeout: 5000 });
// Throws TimeoutError after 5000ms
```

---

## AbortController

```javascript
const controller = new AbortController();
Feto.get(url, { signal: controller.signal });
controller.abort(); // Throws AbortError
```

---

## Retry

```javascript
await Feto.get(url, {
  retry: 3,
  retryDelay: 1000
});
```

### Exponential Backoff

```javascript
await Feto.get(url, {
  retry: 3,
  retryDelay: 500,
  retryBackoff: "exponential"
});
// Delays: 500ms, 1000ms, 2000ms
```

### Instance default

```javascript
const api = Feto.create({
  retry: 2,
  retryDelay: 500,
  retryBackoff: "exponential"
});
```

### Retry rules

- Network errors: retry
- Timeout errors: retry
- 5xx HTTP errors: retry
- 4xx errors: no retry
- AbortError: no retry

---

## Interceptors

### Global

```javascript
const reqId = Feto.interceptors.request.use((config) => {
  config.headers["X-Intercepted"] = "true";
  return config;
});

const resId = Feto.interceptors.response.use((response) => {
  response.customFlag = "intercepted";
  return response;
});

Feto.interceptors.request.eject(reqId);
Feto.interceptors.response.eject(resId);
```

### Instance-level

```javascript
const api = Feto.create();

api.interceptors.request.use((config) => {
  config.headers["X-Instance"] = "true";
  return config;
});

api.interceptors.response.use((response) => {
  response.custom = "instance";
  return response;
});
```

Instance interceptors only affect that instance. Global interceptors continue working independently.

---

## Cache

```javascript
const response = await Feto.get(url, {
  cache: true,
  ttl: 30000  // Cache for 30 seconds
});

console.log(response.fromCache); // true or false
```

### Cache metadata

```javascript
response.duration // 0 for cached responses
```

### Cache API

```javascript
Feto.cache.clear();    // Clear all cached responses
Feto.cache.has(key);   // Check if key exists
Feto.cache.delete(key); // Delete specific entry
```

### Instance cache

```javascript
api.cache.clear();
api.cache.has(key);
api.cache.delete(key);
```

### Cache security

Different Authorization contexts create different cache entries. Raw tokens are never stored in cache keys.

---

## Request Deduplication

Multiple identical GET requests share one network request:

```javascript
const [a, b, c] = await Promise.all([
  Feto.get(url),
  Feto.get(url),
  Feto.get(url)
]);
// Only ONE network request was made
```

Deduplication is authentication-aware.

---

## FormData

```javascript
const form = new FormData();
form.append("name", "Bappi");
form.append("file", fileInput.files[0]);

await Feto.post("https://api.example.com/upload", form);
```

---

## Error Types

| Error Name | When | Properties |
|------------|------|------------|
| HttpError | Server returned 4xx/5xx | `status`, `statusText`, `response`, `config` |
| TimeoutError | Request exceeded timeout | `config` |
| AbortError | Request was cancelled | `config` |
| NetworkError | Failed to reach server | `config`, `originalError` |

### Error metadata

```javascript
try {
  await Feto.get(url);
} catch (error) {
  console.log(error.name);     // "HttpError"
  console.log(error.status);   // 404
  console.log(error.config);   // { method: "GET", url: "..." }
  console.log(error.response); // { data, status, headers, ... }
}
```

---

## Request Duration

```javascript
const response = await Feto.get(url);
console.log(response.duration); // e.g. 243 (milliseconds)

// Cached responses have duration: 0
const cached = await Feto.get(url, { cache: true, ttl: 60000 });
console.log(cached.duration); // 0
```

---

## TypeScript

TypeScript declarations are included:

```typescript
import Feto, { FetoInstance, RequestOptions, Response } from "feto.js";

const api: FetoInstance = Feto.create({ baseURL: "https://api.example.com" });
const res: Response = await api.get("/users");
```

---

## Distribution Files

| File | Size | Description |
|------|------|-------------|
| `dist/feto.js` | ~22 KB | Readable browser build (IIFE) |
| `dist/feto.min.js` | ~9 KB | Minified browser build |
| `dist/feto.esm.js` | ~21 KB | ES module build |
| `dist/feto.cjs.js` | ~18 KB | CommonJS build (Node.js) |

---

## API Reference

```javascript
// Static API
Feto.VERSION                    // "1.0.0"
Feto.init()                     // Returns Feto
Feto.create(options)            // Create instance
Feto.get(url, options)
Feto.post(url, data, options)
Feto.put(url, data, options)
Feto.patch(url, data, options)
Feto.delete(url, options)

// Static Auth
Feto.auth.setToken(token)
Feto.auth.getToken()
Feto.auth.clearToken()

// Static Interceptors
Feto.interceptors.request.use(handler)    // Returns ID
Feto.interceptors.request.eject(id)
Feto.interceptors.response.use(handler)   // Returns ID
Feto.interceptors.response.eject(id)

// Static Cache
Feto.cache.clear()
Feto.cache.has(key)
Feto.cache.delete(key)

// Instance API
api.get(url, options)
api.post(url, data, options)
api.put(url, data, options)
api.patch(url, data, options)
api.delete(url, options)
api.auth.setToken(token)
api.auth.getToken()
api.auth.clearToken()
api.interceptors.request.use(handler)
api.interceptors.request.eject(id)
api.interceptors.response.use(handler)
api.interceptors.response.eject(id)
api.cache.clear()
api.cache.has(key)
api.cache.delete(key)
```

**Options:**

| Property | Type | Description |
|----------|------|-------------|
| headers | Object | Custom HTTP headers |
| timeout | Number | Timeout in milliseconds |
| signal | AbortSignal | For manual cancellation |
| retry | Number | Number of retry attempts |
| retryDelay | Number | Delay between retries in ms |
| retryBackoff | String | "fixed" or "exponential" |
| cache | Boolean | Enable response caching (GET only) |
| ttl | Number | Cache lifetime in milliseconds |
| params | Object | Query parameters |

**Create Options:**

| Property | Type | Description |
|----------|------|-------------|
| baseURL | String | Base URL for relative paths |
| headers | Object | Default headers |
| timeout | Number | Default timeout |
| retry | Number | Default retry count |
| retryDelay | Number | Default retry delay |
| retryBackoff | String | Default backoff strategy |
| token | String | Default Bearer token |
| cache | Boolean | Default cache setting |
| ttl | Number | Default TTL |

---

## Browser Support

Feto.js works in all modern browsers that support ES2017+ (async/await) and AbortController.

## License

MIT License. See [LICENSE](./LICENSE) for details.
