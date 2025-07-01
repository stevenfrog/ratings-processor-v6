# TC Ratings Processor (Modernized)

This processor listens to Kafka events for Marathon Matches (MM) and updates user ratings based on challenge results. This version has been refactored to use a modern technology stack for better maintainability and scalability.

## Dependencies

- Node.js (v18 or newer)
- TypeScript
- PostgreSQL
- Prisma
- Docker & Docker Compose

## Configuration

Configuration is managed via environment variables. This project uses two separate files for clarity:
- `.env`: For running **local commands** (like `prisma migrate`).
- `docker.env`: For running the application **inside Docker Compose**.

### Key Environment Variables

- `DATABASE_URL`: **(Required)** The connection string for your PostgreSQL database.
- `M2M_TOKEN`: **(Required)** A valid M2M bearer token for authenticating with the Topcoder API.
- `SUBMISSION_API_URL`: The base URL for the Topcoder Submissions API.
- `KAFKA_URL`: Comma-separated list of Kafka broker URLs.

## Local Deployment with Docker (Recommended)

### Step 1: Initial (One-Time) Database Setup

This step creates the necessary migration files. You only need to do this once.

1.  **Start Database Service**: From the project root, run 
    ```bash
    docker compose up -d postgres
    ```
    This starts just the database container in the background, making it available on `localhost:5432`.

2.  **Create `.env` file for local commands**:
    - Copy `.env.example` to a new file named `.env`.
    - The default `DATABASE_URL` (`postgresql://user:password@localhost:5432/ratings_db`) is correct for this step.

3.  **Create Migrations**: Run the following command **locally**. This will connect to the running database container and create the initial migration files in a new `prisma/migrations` directory.
    ```bash
    npx prisma migrate dev --name init
    ```

4.  **Stop the Database**: Run `docker compose down` to stop the standalone database container.

### Step 2: Running the Full Application

1.  **Create `docker.env` file for the application**:
    - Copy `docker.env.example` to a new file named `docker.env`.
    - Open `docker.env` and **paste the provided access token** into the `M2M_TOKEN` variable.

2.  **Build and Run All Services**:
    From the project root, run:
    ```bash
    docker compose up --build -d
    ```
    The `kafka-setup` service will automatically create the necessary Kafka topics before the main application starts.

3.  **Seed the Database**:
    After the containers are running, execute this command to populate the database with test data.
    ```bash
    docker compose exec legacy-rating-processor npx prisma db seed
    ```

## Local Testing with Mock API

For cases where a valid `M2M_TOKEN` is unavailable or expired, you can run the processor against a mock Submission API.

### Step 1: Run the Mock API Server

In a separate terminal, start the mock API server from the project's root directory.

```bash
# Ensure node dependencies are installed
npm install

# Run the mock server
node mock/mock-api.js
# The mock server will be listening on http://localhost:3001
```

### Step 2: Configure the Processor to Use the Mock API

Edit your `docker.env` file and set the `SUBMISSION_API_URL` to point to the mock server.

```
SUBMISSION_API_URL=http://host.docker.internal:3001
```

**Note:** `host.docker.internal` is a special DNS name that resolves to the host machine's IP address from within a Docker container. This allows the processor running in Docker to connect to the mock API server running on your local machine.

### Step 3: Restart the Processor

After modifying the `docker.env` file, restart the processor to apply the changes.

```bash
docker compose up -d --force-recreate legacy-rating-processor
```

The processor will now use the mock API for its requests.

### Troubleshooting: `ECONNREFUSED` on Linux

If you see a `connect ECONNREFUSED` error in the logs when the processor tries to connect to `host.docker.internal`, it may be because you are running on Linux where this feature can be inconsistent.

To fix this, you need to explicitly tell the Docker container how to find the host. Edit your `docker-compose.yml` and add an `extra_hosts` entry to the `legacy-rating-processor` service:

```yaml
# In your docker-compose.yml
services:
  legacy-rating-processor:
    # ... other service configuration
    extra_hosts:
      - "host.docker.internal:host-gateway"
    # ... other service configuration
```

The `host-gateway` value is a special string that resolves to the host's IP address inside the container. After adding this, restart the service with the command from Step 3.

## Verification

Your application is now fully running. To verify that it's working correctly:
- **View Logs:** `docker compose logs -f legacy-rating-processor`
- **Test Functionality:** Follow the steps in **`Validation.md`**.
