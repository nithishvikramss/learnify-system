package com.learnify.server.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "marks")
public class Marks {

    @Id
    private String id;
    private String studentId;
    private String subjectId;
    private double internalMarks;
    private double externalMarks;
    private double totalMarks;

    public static final double PASS_MARK = 40.0;
    public static final double MAX_MARKS = 100.0;

    public Marks() {}

    public Marks(String studentId, String subjectId, double internalMarks, double externalMarks) {
        this.studentId = studentId;
        this.subjectId = subjectId;
        this.internalMarks = internalMarks;
        this.externalMarks = externalMarks;
        this.totalMarks = internalMarks + externalMarks;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }

    public String getSubjectId() { return subjectId; }
    public void setSubjectId(String subjectId) { this.subjectId = subjectId; }

    public double getInternalMarks() { return internalMarks; }
    public void setInternalMarks(double internalMarks) {
        this.internalMarks = internalMarks;
        this.totalMarks = this.internalMarks + this.externalMarks;
    }

    public double getExternalMarks() { return externalMarks; }
    public void setExternalMarks(double externalMarks) {
        this.externalMarks = externalMarks;
        this.totalMarks = this.internalMarks + this.externalMarks;
    }

    public double getTotalMarks() { return totalMarks; }
    public void setTotalMarks(double totalMarks) { this.totalMarks = totalMarks; }

    public boolean isPassed() {
        return this.totalMarks >= PASS_MARK;
    }

    public double getPercentage() {
        return (this.totalMarks / MAX_MARKS) * 100.0;
    }
}
