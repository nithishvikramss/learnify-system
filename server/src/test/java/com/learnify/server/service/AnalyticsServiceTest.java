package com.learnify.server.service;

import com.learnify.server.dto.PassFailStatsDTO;
import com.learnify.server.entity.Marks;
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
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AnalyticsServiceTest {

    @Mock private MarksRepository marksRepository;
    @Mock private StudentRepository studentRepository;
    @Mock private SubjectRepository subjectRepository;
    @InjectMocks private AnalyticsService analyticsService;

    /** Regression test for bug B7: the dashboard pass rule must match the report card (all subjects passed). */
    @Test
    void studentWithGoodAverageButOneFailedSubjectCountsAsFailed() {
        when(marksRepository.findAll()).thenReturn(List.of(
                new Marks("alice", "maths", 30, 30),   // 60 pass
                new Marks("alice", "physics", 25, 25), // 50 pass
                new Marks("bob", "maths", 40, 40),     // 80 pass
                new Marks("bob", "physics", 15, 15)    // 30 fail: bob averages 55 but has failed a subject
        ));

        PassFailStatsDTO stats = analyticsService.getPassFailStats();

        assertThat(stats.getTotalStudents()).isEqualTo(2);
        assertThat(stats.getPassCount()).isEqualTo(1);
        assertThat(stats.getFailCount()).isEqualTo(1);
        assertThat(stats.getPassPercentage()).isEqualTo(50.0);
    }

    @Test
    void classAverageUsesPercentageOfEachSubjectsMax() {
        Marks outOf50 = new Marks("alice", "lab", 15, 10); // 25/50 = 50%
        outOf50.setMaxMarks(50);
        Marks outOf100 = new Marks("alice", "maths", 35, 35); // 70/100 = 70%
        when(marksRepository.findAll()).thenReturn(List.of(outOf50, outOf100));

        assertThat(analyticsService.getClassAverage()).isEqualTo(60.0);
    }
}
