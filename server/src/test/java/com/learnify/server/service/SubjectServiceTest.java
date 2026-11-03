package com.learnify.server.service;

import com.learnify.server.entity.Marks;
import com.learnify.server.entity.Subject;
import com.learnify.server.exception.BadRequestException;
import com.learnify.server.exception.ConflictException;
import com.learnify.server.repository.MarksRepository;
import com.learnify.server.repository.SubjectRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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
class SubjectServiceTest {

    @Mock private SubjectRepository subjectRepository;
    @Mock private MarksRepository marksRepository;
    @InjectMocks private SubjectService subjectService;

    private static Subject subject(String id, int max) {
        Subject s = new Subject("Mathematics", "math101", max);
        s.setId(id);
        return s;
    }

    @Test
    void duplicateCodeIsRejected() {
        when(subjectRepository.existsByCode("MATH101")).thenReturn(true);

        assertThatThrownBy(() -> subjectService.addSubject(subject(null, 100)))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("MATH101");
    }

    /** Regression test for bug B5: deleting a subject must not leave orphaned marks. */
    @Test
    void deleteWithMarksIsBlockedWithoutCascade() {
        when(subjectRepository.existsById("sub1")).thenReturn(true);
        when(marksRepository.countBySubjectId("sub1")).thenReturn(3L);

        assertThatThrownBy(() -> subjectService.deleteSubject("sub1", false))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("3 marks record(s)");
        verify(subjectRepository, never()).deleteById(any());
    }

    @Test
    void cascadeDeleteRemovesMarksToo() {
        when(subjectRepository.existsById("sub1")).thenReturn(true);
        when(marksRepository.countBySubjectId("sub1")).thenReturn(3L);

        subjectService.deleteSubject("sub1", true);

        verify(marksRepository).deleteBySubjectId("sub1");
        verify(subjectRepository).deleteById("sub1");
    }

    @Test
    void loweringMaxBelowExistingMarksIsRejected() {
        when(subjectRepository.findById("sub1")).thenReturn(Optional.of(subject("sub1", 100)));
        when(marksRepository.findBySubjectId("sub1")).thenReturn(List.of(new Marks("stu1", "sub1", 40, 40)));

        assertThatThrownBy(() -> subjectService.updateSubject("sub1", subject(null, 50)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("1 student(s)");
        verify(subjectRepository, never()).save(any());
    }

    @Test
    void changingMaxUpdatesExistingMarks() {
        Marks m = new Marks("stu1", "sub1", 20, 20);
        when(subjectRepository.findById("sub1")).thenReturn(Optional.of(subject("sub1", 100)));
        when(marksRepository.findBySubjectId("sub1")).thenReturn(List.of(m));
        when(subjectRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Subject saved = subjectService.updateSubject("sub1", subject(null, 50));

        assertThat(saved.getMaxMarks()).isEqualTo(50);
        assertThat(saved.getCode()).isEqualTo("MATH101");
        assertThat(m.getMaxMarks()).isEqualTo(50);
        assertThat(m.getPercentage()).isEqualTo(80.0);
        verify(marksRepository).saveAll(List.of(m));
    }
}
