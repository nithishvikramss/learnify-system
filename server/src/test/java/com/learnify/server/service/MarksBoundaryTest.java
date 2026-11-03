package com.learnify.server.service;

import com.learnify.server.dto.MarksDetailDTO;
import com.learnify.server.entity.Marks;
import com.learnify.server.entity.Student;
import com.learnify.server.entity.Subject;
import com.learnify.server.exception.BadRequestException;
import com.learnify.server.exception.NotFoundException;
import com.learnify.server.repository.MarksRepository;
import com.learnify.server.repository.StudentRepository;
import com.learnify.server.repository.SubjectRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** Boundary and edge cases for marks entry (TEST_CASES.md: MRK-B-*, MRK-E-*). */
@ExtendWith(MockitoExtension.class)
class MarksBoundaryTest {

    @Mock private MarksRepository marksRepository;
    @Mock private StudentRepository studentRepository;
    @Mock private SubjectRepository subjectRepository;
    @InjectMocks private MarksService marksService;

    private void subjectWithMax(int max) {
        Subject s = new Subject("Lab", "LAB1", max);
        s.setId("sub1");
        when(studentRepository.existsById("stu1")).thenReturn(true);
        when(subjectRepository.findById("sub1")).thenReturn(Optional.of(s));
        lenient().when(marksRepository.findAllByStudentIdAndSubjectId("stu1", "sub1")).thenReturn(List.of());
        lenient().when(marksRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    @ParameterizedTest(name = "max {0}: {1} + {2} accepted")
    @CsvSource({
            "100, 0, 0",        // minimum
            "100, 40, 60",      // exactly max
            "100, 50.1, 49.9",  // decimals summing exactly to max
            "50, 20, 30",       // exactly max of a 50-mark subject
            "1, 0, 1",          // smallest allowed subject max
            "200, 100, 100"     // largest allowed subject max
    })
    void totalsUpToMaxAreAccepted(int max, double internal, double external) {
        subjectWithMax(max);
        Marks saved = marksService.addOrUpdateMarks(new Marks("stu1", "sub1", internal, external));
        assertThat(saved.getTotalMarks()).isLessThanOrEqualTo(max);
        assertThat(saved.getMaxMarks()).isEqualTo(max);
    }

    @ParameterizedTest(name = "max {0}: {1} + {2} rejected")
    @CsvSource({
            "100, 50, 50.5",    // just above max
            "50, 25, 26",       // 51 out of 50
            "1, 1, 0.01"        // tiny overflow
    })
    void totalsAboveMaxAreRejected(int max, double internal, double external) {
        subjectWithMax(max);
        assertThatThrownBy(() -> marksService.addOrUpdateMarks(new Marks("stu1", "sub1", internal, external)))
                .isInstanceOf(BadRequestException.class);
        verify(marksRepository, never()).save(any());
    }

    @Test
    void passBoundaryIsExactly40Percent() {
        Marks atBoundary = new Marks("s", "x", 20, 20);  // 40/100
        Marks justBelow = new Marks("s", "x", 20, 19.99);
        assertThat(atBoundary.isPassed()).isTrue();
        assertThat(justBelow.isPassed()).isFalse();
    }

    @Test
    void unknownSubjectIsRejected() {
        when(studentRepository.existsById("stu1")).thenReturn(true);
        when(subjectRepository.findById("ghost")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> marksService.addOrUpdateMarks(new Marks("stu1", "ghost", 1, 1)))
                .isInstanceOf(NotFoundException.class)
                .hasMessage("Subject not found");
    }

    @Test
    void detailsIncludeNamesAndHandleDeletedStudentOrSubject() {
        Student stu = new Student("Asha", "Civil", 2, null);
        stu.setId("stu1");
        stu.setRegisterNumber("21CV001");
        Subject sub = new Subject("Maths", "MA1", 50);
        sub.setId("sub1");
        Marks known = new Marks("stu1", "sub1", 10, 15);
        known.setMaxMarks(50);
        Marks orphan = new Marks("gone", "gone", 10, 10); // legacy record, no maxMarks
        when(marksRepository.findAll()).thenReturn(List.of(known, orphan));
        when(studentRepository.findAll()).thenReturn(List.of(stu));
        when(subjectRepository.findAll()).thenReturn(List.of(sub));

        List<MarksDetailDTO> details = marksService.getAllMarksWithDetails();

        assertThat(details.get(0).getStudentName()).isEqualTo("Asha");
        assertThat(details.get(0).getRegisterNumber()).isEqualTo("21CV001");
        assertThat(details.get(0).getPercentage()).isEqualTo(50.0);
        assertThat(details.get(0).isPassed()).isTrue();
        assertThat(details.get(1).getStudentName()).isNull();
        assertThat(details.get(1).getMaxMarks()).isEqualTo(100.0);
    }
}
