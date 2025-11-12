# IDP Backend

Identity Provider Backend Service with Hono Framework.

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Server starts on `http://localhost:3002` by default.

## Environment Variables

### Port Configuration

You can set the port using the `PORT` environment variable:

```bash
PORT=8080 npm run dev
```

### Cosmos DB Configuration

The application requires these Cosmos DB environment variables:

```
COSMOS_DB_ENDPOINT=your_cosmos_endpoint
COSMOS_DB_KEY=your_cosmos_key
COSMOS_DB_DATABASE_ID=your_database_id
```

You can add these to your `.env` file:

```
PORT=8080
COSMOS_DB_ENDPOINT=https://your-account.documents.azure.com:443/
COSMOS_DB_KEY=your_master_key
COSMOS_DB_DATABASE_ID=your_database
```

Without the `PORT` variable, port 3002 is used as default.
