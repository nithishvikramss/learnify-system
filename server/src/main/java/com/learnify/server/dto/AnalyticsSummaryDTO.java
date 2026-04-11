package com.learnify.server.dto;

import java.util.List;

public class AnalyticsSummaryDTO {
    private long totalStudents;
    private long totalSubjects;
    private double classAverage;
    private double passPercentage;
    private double failPercentage;
    private long belowThresholdCount;
    private String lowestSubject;
    private String topPerformerName;
    private double topPerformerScore;
    private List<SubjectAverageDTO> subjectAverages;
    private List<TopStudentDTO> topStudents;
    private List<String> insights;

    public AnalyticsSummaryDTO() {}

    public long getTotalStudents() { return totalStudents; }
    public void setTotalStudents(long totalStudents) { this.totalStudents = totalStudents; }

    public long getTotalSubjects() { return totalSubjects; }
    public void setTotalSubjects(long totalSubjects) { this.totalSubjects = totalSubjects; }

    public double getClassAverage() { return classAverage; }
    public void setClassAverage(double classAverage) { this.classAverage = classAverage; }

    public double getPassPercentage() { return passPercentage; }
    public void setPassPercentage(double passPercentage) { this.passPercentage = passPercentage; }

    public double getFailPercentage() { return failPercentage; }
    public void setFailPercentage(double failPercentage) { this.failPercentage = failPercentage; }

    public long getBelowThresholdCount() { return belowThresholdCount; }
    public void setBelowThresholdCount(long belowThresholdCount) { this.belowThresholdCount = belowThresholdCount; }

    public String getLowestSubject() { return lowestSubject; }
    public void setLowestSubject(String lowestSubject) { this.lowestSubject = lowestSubject; }

    public String getTopPerformerName() { return topPerformerName; }
    public void setTopPerformerName(String topPerformerName) { this.topPerformerName = topPerformerName; }

    public double getTopPerformerScore() { return topPerformerScore; }
    public void setTopPerformerScore(double topPerformerScore) { this.topPerformerScore = topPerformerScore; }

    public List<SubjectAverageDTO> getSubjectAverages() { return subjectAverages; }
    public void setSubjectAverages(List<SubjectAverageDTO> subjectAverages) { this.subjectAverages = subjectAverages; }

    public List<TopStudentDTO> getTopStudents() { return topStudents; }
    public void setTopStudents(List<TopStudentDTO> topStudents) { this.topStudents = topStudents; }

    public List<String> getInsights() { return insights; }
    public void setInsights(List<String> insights) { this.insights = insights; }
}
