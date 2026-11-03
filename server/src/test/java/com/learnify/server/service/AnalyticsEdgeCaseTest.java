package com.learnify.server.service;

import com.learnify.server.dto.AnalyticsSummaryDTO;
import com.learnify.server.dto.SubjectAverageDTO;
import com.learnify.server.dto.TopStudentDTO;
import com.learnify.server.entity.Marks;
import com.learnify.server.entity.Student;
import com.learnify.server.entity.Subject;
import com.learnify.server.repository.MarksRepository;
import com.learnify.server.repository.StudentRepository;
import com.learnify.server.repository.SubjectRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

/** Analytics positive and edge cases (TEST_CASES.md: ANA-*). */
@ExtendWith(MockitoExtension.class)
class AnalyticsEdgeCaseTest {

    @Mock private MarksRepository marksRepository;
    @Mock private StudentRepository studentRepository;
    @Mock private SubjectRepository subjectRepository;
    @InjectMocks private AnalyticsService analyticsService;

    private static Student student(String id, String name) {
        Student s = new Student(name, "Civil", 3, null);
        s.setId(id);
        return s;
    }

    private static Subject subject(String id, String name) {
        Subject s = new Subject(name, id.toUpperCase(), 100);
        s.setId(id);
        return s;
    }

    private void sampleData() {
        lenient().when(studentRepository.findAll()).thenReturn(List.of(
                student("a", "Asha"), student("b", "Bala"), student("c", "Chitra")));
        lenient().when(subjectRepository.findAll()).thenReturn(List.of(subject("ma", "Maths"), subject("ph", "Physics")));
        lenient().when(marksRepository.findAll()).thenReturn(List.of(
                new Marks("a", "ma", 40, 50), new Marks("a", "ph", 40, 40),   // Asha 90, 80 -> 85
                new Marks("b", "ma", 30, 30), new Marks("b", "ph", 10, 20),   // Bala 60, 30 -> 45 (fails physics)
                new Marks("c", "ma", 15, 15), new Marks("c", "ph", 20, 20))); // Chitra 30, 40 -> 35
        lenient().when(studentRepository.count()).thenReturn(3L);
        lenient().when(subjectRepository.count()).thenReturn(2L);
    }

    @Test
    void emptyDatabaseGivesZeroSummaryWithoutErrors() {
        when(marksRepository.findAll()).thenReturn(List.of());

        AnalyticsSummaryDTO summary = analyticsService.getAnalyticsSummary();

        assertThat(summary.getClassAverage()).isZero();
        assertThat(summary.getPassPercentage()).isZero();
        assertThat(summary.getTopStudents()).isEmpty();
        assertThat(summary.getTopPerformerName()).isNull();
        assertThat(summary.getInsights()).isEmpty();
    }

    @Test
    void topStudentsAreRankedByAveragePercentage() {
        sampleData();

        List<TopStudentDTO> top = analyticsService.getTopStudents(2);

        assertThat(top).extracting(TopStudentDTO::getStudentName).containsExactly("Asha", "Bala");
        assertThat(top).extracting(TopStudentDTO::getRank).containsExactly(1, 2);
        assertThat(top.get(0).getAverageMarks()).isEqualTo(85.0);
    }

    @Test
    void topStudentsWithLimitZeroIsEmpty() {
        sampleData();
        assertThat(analyticsService.getTopStudents(0)).isEmpty();
    }

    @Test
    void topStudentsLimitLargerThanClassReturnsEveryone() {
        sampleData();
        assertThat(analyticsService.getTopStudents(100)).hasSize(3);
    }

    @Test
    void belowThresholdIsStrictlyBelow() {
        sampleData();
        // Chitra averages 35, Bala 45: threshold 45 must include Chitra only (45 is not "below" 45)
        assertThat(analyticsService.getStudentsBelowThreshold(45))
                .extracting(TopStudentDTO::getStudentName).containsExactly("Chitra");
    }

    @Test
    void subjectAveragesSortedHighestFirst() {
        sampleData();
        List<SubjectAverageDTO> averages = analyticsService.getAverageMarksPerSubject();
        assertThat(averages).extracting(SubjectAverageDTO::getSubjectName).containsExactly("Maths", "Physics");
        assertThat(averages.get(0).getAverageMarks()).isEqualTo(60.0);
    }

    @Test
    void summaryCombinesAllFigures() {
        sampleData();

        AnalyticsSummaryDTO summary = analyticsService.getAnalyticsSummary();

        assertThat(summary.getTotalStudents()).isEqualTo(3);
        assertThat(summary.getClassAverage()).isEqualTo(55.0);
        // Only Asha passed every subject: 1 of 3
        assertThat(summary.getPassPercentage()).isEqualTo(33.33);
        assertThat(summary.getBelowThresholdCount()).isEqualTo(1);
        assertThat(summary.getLowestSubject()).isEqualTo("Physics");
        assertThat(summary.getTopPerformerName()).isEqualTo("Asha");
        assertThat(summary.getInsights()).isNotEmpty();
    }
}
