package com.learnify.server.dto;

public class PassFailStatsDTO {
    private long totalStudents;
    private long passCount;
    private long failCount;
    private double passPercentage;
    private double failPercentage;

    public PassFailStatsDTO() {}

    public PassFailStatsDTO(long totalStudents, long passCount, long failCount) {
        this.totalStudents = totalStudents;
        this.passCount = passCount;
        this.failCount = failCount;
        this.passPercentage = totalStudents > 0
                ? Math.round((passCount * 100.0 / totalStudents) * 100.0) / 100.0
                : 0;
        this.failPercentage = totalStudents > 0
                ? Math.round((failCount * 100.0 / totalStudents) * 100.0) / 100.0
                : 0;
    }

    public long getTotalStudents() { return totalStudents; }
    public void setTotalStudents(long totalStudents) { this.totalStudents = totalStudents; }

    public long getPassCount() { return passCount; }
    public void setPassCount(long passCount) { this.passCount = passCount; }

    public long getFailCount() { return failCount; }
    public void setFailCount(long failCount) { this.failCount = failCount; }

    public double getPassPercentage() { return passPercentage; }
    public void setPassPercentage(double passPercentage) { this.passPercentage = passPercentage; }

    public double getFailPercentage() { return failPercentage; }
    public void setFailPercentage(double failPercentage) { this.failPercentage = failPercentage; }
}
