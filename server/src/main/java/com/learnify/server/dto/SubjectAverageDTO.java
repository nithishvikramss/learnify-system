package com.learnify.server.dto;

public class SubjectAverageDTO {
    private String subjectId;
    private String subjectName;
    private double averageMarks;
    private long totalStudents;

    public SubjectAverageDTO() {}

    public SubjectAverageDTO(String subjectId, String subjectName, double averageMarks, long totalStudents) {
        this.subjectId = subjectId;
        this.subjectName = subjectName;
        this.averageMarks = Math.round(averageMarks * 100.0) / 100.0;
        this.totalStudents = totalStudents;
    }

    public String getSubjectId() { return subjectId; }
    public void setSubjectId(String subjectId) { this.subjectId = subjectId; }

    public String getSubjectName() { return subjectName; }
    public void setSubjectName(String subjectName) { this.subjectName = subjectName; }

    public double getAverageMarks() { return averageMarks; }
    public void setAverageMarks(double averageMarks) { this.averageMarks = averageMarks; }

    public long getTotalStudents() { return totalStudents; }
    public void setTotalStudents(long totalStudents) { this.totalStudents = totalStudents; }
}
