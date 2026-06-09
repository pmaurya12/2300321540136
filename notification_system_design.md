# Campus Notification System — Design Document

---

## Stage 1: REST API Design

### Endpoints

**GET /api/students/:studentId/notifications** — fetch notifications with
optional filters like type and isRead, supports pagination

**PATCH /api/notifications/:id/read** — mark one notification as read

**PATCH /api/students/:studentId/notifications/read-all** — mark all as read

**GET /api/students/:studentId/notifications/unread-count** — get unread count

Sample response for GET:
```json
{
  "data": [
    {
      "id": "notif_001",
      "type": "Placement",
      "message": "End semester exam timetable released",
      "isRead": false,
      "createdAt": "2025-05-01T09:30:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 38 }
}
```

### Real-Time Mechanism
I used WebSockets. A connection opens when the student logs in and the
server pushes new notifications instantly without the client polling.

---

## Stage 2: Database and Schema

I chose PostgreSQL because the data is relational and we need to query
by student, type, and date together. MongoDB did not suit this well.

```sql
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    roll_number VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TYPE notif_type AS ENUM ('Placement', 'Result', 'Event');

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id INT REFERENCES students(id) ON DELETE CASCADE,
    type notif_type NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_student_unread_time
ON notifications(student_id, is_read, created_at DESC);
```

For scale, monthly partitioning on created_at and read replicas for
heavy read traffic would help as data grows.

---

## Stage 3: Query Optimization

Original slow query:
```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt DESC;
```

It is slow because there is no index on those three columns so the
database scans all 5 million rows every time.

Fix:
```sql
CREATE INDEX idx_student_read_time
ON notifications(studentID, isRead, createdAt DESC);
```

Students with placement notifications in last 7 days:
```sql
SELECT DISTINCT s.id, s.name, s.email
FROM students s
JOIN notifications n ON s.id = n.student_id
WHERE n.type = 'Placement'
  AND n.created_at >= NOW() - INTERVAL '7 days';
```

---

## Stage 4: Caching

I would add Redis using cache-aside pattern. On each request check Redis
first, if not found query the DB and store the result with a 5 minute
TTL. Invalidate the cache whenever a new notification is added or marked
as read.

This reduces DB load significantly during peak usage. The only tradeoff
is data could be slightly stale but 5 minutes is acceptable for a
notification inbox.

---

## Stage 5: Mass Notification Redesign

The current notify_all is synchronous and has no error handling. For
50,000 students this will block for a long time and silently drop any
failed sends.

Better approach using a message queue:

```python
def notify_all(student_ids, message):
    for student_id in student_ids:
        queue.enqueue({ "student_id": student_id, "message": message, "attempts": 0 })

def worker():
    while True:
        job = queue.dequeue()
        try:
            save_to_db(job["student_id"], job["message"])
            send_email(job["student_id"], job["message"])
        except Exception as e:
            if job["attempts"] < 3:
                job["attempts"] += 1
                queue.enqueue_delayed(job, delay_seconds=2 ** job["attempts"])
            else:
                log_failure(job["student_id"], str(e))
```

notify_all just queues jobs and returns immediately. Workers run in
parallel and retry failed jobs up to 3 times with increasing delays.
I would use BullMQ with Redis for this.

---