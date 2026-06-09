# Campus Notification System — Design Document

## Stage 1: REST API Design

GET /api/students/:studentId/notifications — fetch notifications  
PATCH /api/notifications/:id/read — mark one as read  
PATCH /api/students/:studentId/notifications/read-all — mark all as read  
GET /api/students/:studentId/notifications/unread-count — unread count  

Real-time using WebSockets to push notifications on login.

## Stage 2: Database and Schema

Using PostgreSQL. Data is relational so SQL fits better than NoSQL.

```sql
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    roll_number VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id INT REFERENCES students(id),
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Stage 3: Query Optimization

Slow because no index exists on studentID and isRead columns.

Added index:
```sql
CREATE INDEX idx_student_read ON notifications(student_id, is_read, created_at DESC);
```

Query for placement notifications in last 7 days:
```sql
SELECT DISTINCT s.id, s.name FROM students s
JOIN notifications n ON s.id = n.student_id
WHERE n.type = 'Placement' AND n.created_at >= NOW() - INTERVAL '7 days';
```

## Stage 4: Caching

Using Redis. Check cache first on every request. If not found, query DB
and store with 5 minute TTL. Clear cache when notification is added or read.

## Stage 5: Mass Notification Redesign

Current function is synchronous with no error handling. Fails silently.

Fix: use a message queue. Push each student job to queue and process
with workers. Retry up to 3 times on failure.

```python
def notify_all(student_ids, message):
    for id in student_ids:
        queue.enqueue({"student_id": id, "message": message, "attempts": 0})

def worker():
    job = queue.dequeue()
    try:
        save_to_db(job["student_id"], job["message"])
        send_email(job["student_id"], job["message"])
    except:
        if job["attempts"] < 3:
            job["attempts"] += 1
            queue.enqueue_delayed(job)
```
