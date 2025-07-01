# Topcoder - Ratings Processor Verification (PostgreSQL)

## Verification Steps

Before you begin, ensure the full application stack is running via `docker-compose up`. You can use `psql` or a GUI tool like DBeaver to connect to your PostgreSQL database (connect to `localhost:5432` with user `user`, password `password`, and database `ratings_db`).

---

### Test 1: Process a New User Registration

1.  **Start Kafka Producer:**
    Open a terminal and start a Kafka console producer for the `challenge.notification.events` topic.
    ```bash
    docker compose exec kafka kafka-console-producer --bootstrap-server kafka:29092 --topic challenge.notification.events
    ```

2.  **Send Registration Message:**
    Paste the following JSON message into the producer console and press Enter:
    ```json
    { "topic": "challenge.notification.events","originator": "challenge-api","timestamp": "2025-06-21T12:00:00.000Z","mime-type": "application/json","payload": { "type": "USER_REGISTRATION", "data": { "challengeId": 30054163, "userId": 27244033, "handle": "testuser1" } } }
    ```

3.  **Check App Logs:**
    The `docker-compose logs -f legacy-rating-processor` output should show messages indicating it received and successfully processed the event.

4.  **Verify Database:**
    Execute the following SQL queries to verify that records were created.
    ```sql
    -- Check if the user was created
    SELECT * FROM "users" WHERE id = 27244033;

    -- Check if the user was registered for the challenge
    SELECT * FROM "user_challenges" WHERE "userId" = 27244033;
    ```
    *You should see one row in `user_challenges` for the user and challenge.*

---

### Test 2: Process a Submission Review

1.  **Start Kafka Producer:**
    If not already running, start a producer for the `submission.notification.aggregate` topic.
    ```bash
    docker compose exec kafka kafka-console-producer --bootstrap-server kafka:29092 --topic submission.notification.aggregate
    ```

2.  **Send Review Message:**
    Paste the following message:
    ```json
    { "topic": "submission.notification.aggregate","originator": "submission-api","timestamp": "2025-06-21T12:05:00.000Z","mime-type": "application/json","payload": { "resource": "review", "submissionId": "14a1b211-283b-4f9a-809f-71e200646560", "typeId": "55bbb17d-aac2-45a6-89c3-a8d102863d05", "score": 90.12, "originalTopic": "submission.notification.create" } }
    ```

3.  **Verify Database:**
    ```sql
    SELECT * FROM "submissions" WHERE "userId" = 27244033;
    ```
    *You should see a new row with a score of `90.12`.*

---

### Test 3: Process a Review Summation

1.  **Send Review Summation Message:** (Use the `submission.notification.aggregate` topic producer).
    ```json
    { "topic": "submission.notification.aggregate","originator": "submission-api","timestamp": "2025-06-21T12:10:00.000Z","mime-type": "application/json","payload": { "resource": "reviewSummation", "submissionId": "14a1b211-283b-4f9a-809f-71e200646560", "aggregateScore": 98, "originalTopic": "submission.notification.create" } }
    ```

2.  **Verify Database:**
    ```sql
    SELECT "system_point_total", "attended" FROM "user_challenges" WHERE "userId" = 27244033;
    ```
    *The result should show `system_point_total` as `98` and `attended` as `'Y'`.*

---

### Test 4: Process a Review End Event

1.  **Start Kafka Producer:** (Use a producer for `notifications.autopilot.events`).
    ```bash
    docker compose exec kafka kafka-console-producer --bootstrap-server kafka:29092 --topic notifications.autopilot.events
    ```

2.  **Send Review End Message:**
    ```json
    { "topic": "notifications.autopilot.events","originator": "challenge-api","timestamp": "2025-06-21T12:15:00.000Z","mime-type": "application/json","payload": { "projectId": 30054163, "phaseTypeName": "Review", "state": "End" } }
    ```

3.  **Verify Database:**
    ```sql
    -- Check for old rating/vol and placement
    SELECT "placed", "old_rating", "old_vol" FROM "user_challenges" WHERE "userId" = 27244033;

    -- Check the new rating history table
    SELECT * FROM "rating_history" WHERE "userId" = 27244033;
    ```
    *You should see new records in `rating_history` and updated records in `user_challenges`.*
