package com.learnify.server.dto;

public class TopStudentDTO {
    private String studentId;
    private String studentName;
    private String department;
    private int semester;
    private double averageMarks;
    private double percentage;
    private int rank;

    public TopStudentDTO() {}

    public TopStudentDTO(String studentId, String studentName, String department, int semester,
                         double averageMarks, int rank) {
        this.studentId = studentId;
        this.studentName = studentName;
        this.department = department;
        this.semester = semester;
        this.averageMarks = Math.round(averageMarks * 100.0) / 100.0;
        this.percentage = Math.round((averageMarks / 100.0) * 100.0 * 100.0) / 100.0;
        this.rank = rank;
    }

    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }

    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public int getSemester() { return semester; }
    public void setSemester(int semester) { this.semester = semester; }

    public double getAverageMarks() { return averageMarks; }
    public void setAverageMarks(double averageMarks) { this.averageMarks = averageMarks; }

    public double getPercentage() { return percentage; }
    public void setPercentage(double percentage) { this.percentage = percentage; }

    public int getRank() { return rank; }
    public void setRank(int rank) { this.rank = rank; }
}
