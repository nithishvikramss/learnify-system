package com.learnify.server.service;

import com.learnify.server.dto.AnalyticsSummaryDTO;
import com.learnify.server.dto.PassFailStatsDTO;
import com.learnify.server.dto.SubjectAverageDTO;
import com.learnify.server.dto.TopStudentDTO;
import com.learnify.server.entity.Marks;
import com.learnify.server.entity.Student;
import com.learnify.server.entity.Subject;
import com.learnify.server.repository.MarksRepository;
import com.learnify.server.repository.StudentRepository;
import com.learnify.server.repository.SubjectRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final MarksRepository marksRepository;
    private final StudentRepository studentRepository;
    private final SubjectRepository subjectRepository;

    public AnalyticsService(MarksRepository marksRepository,
                            StudentRepository studentRepository,
                            SubjectRepository subjectRepository) {
        this.marksRepository = marksRepository;
        this.studentRepository = studentRepository;
        this.subjectRepository = subjectRepository;
    }

    // --- Average marks per subject ---
    public List<SubjectAverageDTO> getAverageMarksPerSubject() {
        List<Marks> allMarks = marksRepository.findAll();
        Map<String, Subject> subjectMap = subjectRepository.findAll().stream()
                .collect(Collectors.toMap(Subject::getId, Function.identity()));

        return allMarks.stream()
                .collect(Collectors.groupingBy(Marks::getSubjectId))
                .entrySet().stream()
                .map(entry -> {
                    String subjectId = entry.getKey();
                    List<Marks> subjectMarks = entry.getValue();
                    double avg = subjectMarks.stream()
                            .mapToDouble(Marks::getPercentage)
                            .average()
                            .orElse(0.0);
                    Subject subject = subjectMap.get(subjectId);
                    String subjectName = subject != null ? subject.getName() : "Unknown";
                    return new SubjectAverageDTO(subjectId, subjectName, round2(avg), subjectMarks.size());
                })
                .sorted(Comparator.comparingDouble(SubjectAverageDTO::getAverageMarks).reversed())
                .collect(Collectors.toList());
    }

    // --- Top N students by average marks ---
    public List<TopStudentDTO> getTopStudents(int limit) {
        List<Marks> allMarks = marksRepository.findAll();
        Map<String, Student> studentMap = studentRepository.findAll().stream()
                .collect(Collectors.toMap(Student::getId, Function.identity()));

        List<Map.Entry<String, Double>> ranked = allMarks.stream()
                .collect(Collectors.groupingBy(
                        Marks::getStudentId,
                        Collectors.averagingDouble(Marks::getPercentage)
                ))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .limit(limit)
                .collect(Collectors.toList());

        List<TopStudentDTO> result = new ArrayList<>();
        for (int i = 0; i < ranked.size(); i++) {
            Map.Entry<String, Double> entry = ranked.get(i);
            Student student = studentMap.get(entry.getKey());
            if (student != null) {
                result.add(new TopStudentDTO(
                        student.getId(),
                        student.getName(),
                        student.getDepartment(),
                        student.getSemester(),
                        entry.getValue(),
                        i + 1
                ));
            }
        }
        return result;
    }

    // --- Pass/Fail stats (per unique student) ---
    public PassFailStatsDTO getPassFailStats() {
        List<Marks> allMarks = marksRepository.findAll();

        // A student passes only if they passed every subject they have marks for
        // (same rule as the student report card).
        Map<String, Boolean> passedAll = allMarks.stream()
                .collect(Collectors.groupingBy(
                        Marks::getStudentId,
                        Collectors.reducing(true, Marks::isPassed, Boolean::logicalAnd)
                ));

        long total = passedAll.size();
        long passed = passedAll.values().stream().filter(Boolean::booleanValue).count();
        long failed = total - passed;

        return new PassFailStatsDTO(total, passed, failed);
    }

    // --- Class average (all marks) ---
    public double getClassAverage() {
        List<Marks> allMarks = marksRepository.findAll();
        if (allMarks.isEmpty()) return 0.0;
        double avg = allMarks.stream()
                .mapToDouble(Marks::getPercentage)
                .average()
                .orElse(0.0);
        return round2(avg);
    }

    private static double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    // --- Students below threshold ---
    public List<TopStudentDTO> getStudentsBelowThreshold(double threshold) {
        List<Marks> allMarks = marksRepository.findAll();
        Map<String, Student> studentMap = studentRepository.findAll().stream()
                .collect(Collectors.toMap(Student::getId, Function.identity()));

        return allMarks.stream()
                .collect(Collectors.groupingBy(
                        Marks::getStudentId,
                        Collectors.averagingDouble(Marks::getPercentage)
                ))
                .entrySet().stream()
                .filter(e -> e.getValue() < threshold)
                .sorted(Map.Entry.comparingByValue())
                .map(entry -> {
                    Student student = studentMap.get(entry.getKey());
                    if (student == null) return null;
                    return new TopStudentDTO(
                            student.getId(),
                            student.getName(),
                            student.getDepartment(),
                            student.getSemester(),
                            entry.getValue(),
                            0
                    );
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    // --- Full analytics summary ---
    public AnalyticsSummaryDTO getAnalyticsSummary() {
        AnalyticsSummaryDTO summary = new AnalyticsSummaryDTO();

        long totalStudents = studentRepository.count();
        long totalSubjects = subjectRepository.count();
        summary.setTotalStudents(totalStudents);
        summary.setTotalSubjects(totalSubjects);
        summary.setClassAverage(getClassAverage());

        PassFailStatsDTO pf = getPassFailStats();
        summary.setPassPercentage(pf.getPassPercentage());
        summary.setFailPercentage(pf.getFailPercentage());

        List<SubjectAverageDTO> subjectAverages = getAverageMarksPerSubject();
        summary.setSubjectAverages(subjectAverages);

        List<TopStudentDTO> topStudents = getTopStudents(5);
        summary.setTopStudents(topStudents);

        // Students whose average is below the pass percentage
        List<TopStudentDTO> belowThreshold = getStudentsBelowThreshold(Marks.PASS_PERCENTAGE);
        summary.setBelowThresholdCount(belowThreshold.size());

        // Lowest subject
        subjectAverages.stream()
                .min(Comparator.comparingDouble(SubjectAverageDTO::getAverageMarks))
                .ifPresent(s -> summary.setLowestSubject(s.getSubjectName()));

        // Top performer
        if (!topStudents.isEmpty()) {
            TopStudentDTO top = topStudents.get(0);
            summary.setTopPerformerName(top.getStudentName());
            summary.setTopPerformerScore(top.getPercentage());
        }

        // Insights
        summary.setInsights(generateInsights(summary, subjectAverages, belowThreshold));

        return summary;
    }

    private List<String> generateInsights(AnalyticsSummaryDTO summary,
                                           List<SubjectAverageDTO> subjectAverages,
                                           List<TopStudentDTO> belowThreshold) {
        List<String> insights = new ArrayList<>();

        if (!subjectAverages.isEmpty()) {
            SubjectAverageDTO lowest = subjectAverages.stream()
                    .min(Comparator.comparingDouble(SubjectAverageDTO::getAverageMarks))
                    .orElse(null);
            SubjectAverageDTO highest = subjectAverages.get(0);
            if (lowest != null) {
                insights.add("Average score in " + lowest.getSubjectName() + " is the lowest at "
                        + lowest.getAverageMarks() + "% — needs attention.");
            }
            insights.add("Students perform best in " + highest.getSubjectName()
                    + " with an average of " + highest.getAverageMarks() + "%.");
        }

        if (!belowThreshold.isEmpty()) {
            insights.add(belowThreshold.size() + " student(s) have an average below "
                    + (int) Marks.PASS_PERCENTAGE + "% — immediate intervention needed.");
        }

        if (summary.getTopPerformerName() != null) {
            insights.add("Top performer: " + summary.getTopPerformerName()
                    + " scored " + summary.getTopPerformerScore() + "%.");
        }

        if (summary.getClassAverage() > 0) {
            String level = summary.getClassAverage() >= 70 ? "excellent"
                    : summary.getClassAverage() >= 50 ? "average" : "below average";
            insights.add("Overall class performance is " + level
                    + " with a class average of " + summary.getClassAverage() + "%.");
        }

        if (summary.getPassPercentage() > 0) {
            insights.add(summary.getPassPercentage() + "% of students passed overall.");
        }

        return insights;
    }
}
