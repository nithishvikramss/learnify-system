package com.learnify.server.service;

import com.learnify.server.dto.MarksUpdateRequest;
import com.learnify.server.entity.Marks;
import com.learnify.server.entity.Subject;
import com.learnify.server.exception.BadRequestException;
import com.learnify.server.exception.NotFoundException;
import com.learnify.server.repository.MarksRepository;
import com.learnify.server.repository.StudentRepository;
import com.learnify.server.repository.SubjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MarksServiceTest {

    @Mock private MarksRepository marksRepository;
    @Mock private StudentRepository studentRepository;
    @Mock private SubjectRepository subjectRepository;
    @InjectMocks private MarksService marksService;

    private Subject maths;

    @BeforeEach
    void setUp() {
        maths = new Subject("Mathematics", "MATH101", 100);
        maths.setId("sub1");
    }

    private void studentAndSubjectExist() {
        when(studentRepository.existsById("stu1")).thenReturn(true);
        when(subjectRepository.findById("sub1")).thenReturn(Optional.of(maths));
        when(marksRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void firstEntryCreatesOneRecord() {
        studentAndSubjectExist();
        when(marksRepository.findAllByStudentIdAndSubjectId("stu1", "sub1")).thenReturn(List.of());

        Marks saved = marksService.addOrUpdateMarks(new Marks("stu1", "sub1", 30, 45));

        verify(marksRepository, times(1)).save(any());
        assertThat(saved.getTotalMarks()).isEqualTo(75);
        assertThat(saved.getMaxMarks()).isEqualTo(100);
    }

    /** Regression test for bug B3: re-entering marks must update, not insert a duplicate. */
    @Test
    void reEntryUpdatesExistingRecordInsteadOfInsertingDuplicate() {
        studentAndSubjectExist();
        Marks existing = new Marks("stu1", "sub1", 10, 10);
        existing.setId("m1");
        when(marksRepository.findAllByStudentIdAndSubjectId("stu1", "sub1")).thenReturn(List.of(existing));

        Marks saved = marksService.addOrUpdateMarks(new Marks("stu1", "sub1", 35, 40));

        ArgumentCaptor<Marks> captor = ArgumentCaptor.forClass(Marks.class);
        verify(marksRepository, times(1)).save(captor.capture());
        assertThat(captor.getValue().getId()).isEqualTo("m1");
        assertThat(saved.getTotalMarks()).isEqualTo(75);
    }

    @Test
    void reEntryRemovesDuplicatesLeftByOldBug() {
        studentAndSubjectExist();
        Marks first = new Marks("stu1", "sub1", 10, 10);
        first.setId("m1");
        Marks dup = new Marks("stu1", "sub1", 10, 10);
        dup.setId("m2");
        when(marksRepository.findAllByStudentIdAndSubjectId("stu1", "sub1")).thenReturn(List.of(first, dup));

        marksService.addOrUpdateMarks(new Marks("stu1", "sub1", 20, 20));

        verify(marksRepository).deleteAll(List.of(dup));
        verify(marksRepository, times(1)).save(first);
    }

    @Test
    void totalAboveSubjectMaxIsRejected() {
        when(studentRepository.existsById("stu1")).thenReturn(true);
        when(subjectRepository.findById("sub1")).thenReturn(Optional.of(maths));

        assertThatThrownBy(() -> marksService.addOrUpdateMarks(new Marks("stu1", "sub1", 60, 50)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("cannot exceed the maximum of 100");
        verify(marksRepository, never()).save(any());
    }

    @Test
    void unknownStudentIsRejected() {
        when(studentRepository.existsById("ghost")).thenReturn(false);

        assertThatThrownBy(() -> marksService.addOrUpdateMarks(new Marks("ghost", "sub1", 10, 10)))
                .isInstanceOf(NotFoundException.class)
                .hasMessage("Student not found");
    }

    @Test
    void updateMarksChecksSubjectMax() {
        Marks existing = new Marks("stu1", "sub1", 10, 10);
        existing.setId("m1");
        when(marksRepository.findById("m1")).thenReturn(Optional.of(existing));
        when(subjectRepository.findById("sub1")).thenReturn(Optional.of(maths));

        assertThatThrownBy(() -> marksService.updateMarks("m1", new MarksUpdateRequest(70, 40)))
                .isInstanceOf(BadRequestException.class);
        verify(marksRepository, never()).save(any());
    }

    @Test
    void deleteMissingMarksReturnsNotFound() {
        when(marksRepository.existsById("nope")).thenReturn(false);

        assertThatThrownBy(() -> marksService.deleteMarks("nope")).isInstanceOf(NotFoundException.class);
    }

    @Test
    void percentageUsesSubjectMaxMarks() {
        Marks m = new Marks("stu1", "sub1", 10, 10);
        m.setMaxMarks(50);
        assertThat(m.getPercentage()).isEqualTo(40.0);
        assertThat(m.isPassed()).isTrue();

        Marks legacy = new Marks("stu1", "sub1", 20, 15); // no maxMarks stored, so out of 100
        assertThat(legacy.getPercentage()).isEqualTo(35.0);
        assertThat(legacy.isPassed()).isFalse();
    }
}
