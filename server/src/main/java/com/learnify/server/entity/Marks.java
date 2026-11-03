package com.learnify.server.entity;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "marks")
public class Marks {

    @Id
    private String id;

    @NotBlank(message = "Student is required")
    private String studentId;

    @NotBlank(message = "Subject is required")
    private String subjectId;

    @DecimalMin(value = "0", message = "Internal marks cannot be negative")
    @DecimalMax(value = "200", message = "Internal marks are too large")
    private double internalMarks;

    @DecimalMin(value = "0", message = "External marks cannot be negative")
    @DecimalMax(value = "200", message = "External marks are too large")
    private double externalMarks;

    private double totalMarks;

    /** Snapshot of the subject's max marks when these marks were saved (0 for legacy records = 100). */
    private double maxMarks;

    /** A subject is passed when the student scores at least this percentage. */
    public static final double PASS_PERCENTAGE = 40.0;
    public static final double DEFAULT_MAX_MARKS = 100.0;

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

    public double getMaxMarks() { return maxMarks; }
    public void setMaxMarks(double maxMarks) { this.maxMarks = maxMarks; }

    /** Max marks used for calculations; legacy records without a value are treated as out of 100. */
    public double effectiveMaxMarks() {
        return maxMarks > 0 ? maxMarks : DEFAULT_MAX_MARKS;
    }

    public double getPercentage() {
        return (this.totalMarks / effectiveMaxMarks()) * 100.0;
    }

    public boolean isPassed() {
        return getPercentage() >= PASS_PERCENTAGE;
    }
}
