package com.learnify.server.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/** One student's attendance for one subject on one date. */
@Document(collection = "attendance")
public class Attendance {

    @Id
    private String id;
    private String studentId;
    private String subjectId;
    /** ISO date (yyyy-MM-dd), stored as text so it cannot shift with the server's time zone. */
    private String date;
    private boolean present;

    public Attendance() {}

    public Attendance(String studentId, String subjectId, String date, boolean present) {
        this.studentId = studentId;
        this.subjectId = subjectId;
        this.date = date;
        this.present = present;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }

    public String getSubjectId() { return subjectId; }
    public void setSubjectId(String subjectId) { this.subjectId = subjectId; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public boolean isPresent() { return present; }
    public void setPresent(boolean present) { this.present = present; }
}
