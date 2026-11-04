package com.learnify.server.service;

import com.learnify.server.entity.Student;
import com.learnify.server.exception.ConflictException;
import com.learnify.server.exception.NotFoundException;
import com.learnify.server.repository.AttendanceRepository;
import com.learnify.server.repository.MarksRepository;
import com.learnify.server.repository.StudentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StudentServiceTest {

    @Mock private StudentRepository studentRepository;
    @Mock private MarksRepository marksRepository;
    @Mock private AttendanceRepository attendanceRepository;
    @InjectMocks private StudentService studentService;

    private static Student student(String regNo, String email) {
        Student s = new Student("  Arun Kumar ", "Computer Science", 3, email);
        s.setRegisterNumber(regNo);
        return s;
    }

    @Test
    void createNormalizesAndIgnoresClientId() {
        when(studentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        Student input = student(" 21cs001 ", " Arun@Example.COM ");
        input.setId("someone-elses-id");

        Student saved = studentService.addStudent(input);

        assertThat(saved.getId()).isNull();
        assertThat(saved.getName()).isEqualTo("Arun Kumar");
        assertThat(saved.getRegisterNumber()).isEqualTo("21CS001");
        assertThat(saved.getEmail()).isEqualTo("arun@example.com");
    }

    @Test
    void duplicateRegisterNumberIsRejected() {
        when(studentRepository.existsByRegisterNumber("21CS001")).thenReturn(true);

        assertThatThrownBy(() -> studentService.addStudent(student("21cs001", null)))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("21CS001");
        verify(studentRepository, never()).save(any());
    }

    @Test
    void duplicateEmailIsRejected() {
        when(studentRepository.existsByEmail("arun@example.com")).thenReturn(true);

        assertThatThrownBy(() -> studentService.addStudent(student("21CS001", "arun@example.com")))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void updateKeepingOwnRegisterNumberIsAllowed() {
        Student existing = student("21CS001", null);
        existing.setId("s1");
        when(studentRepository.existsByRegisterNumberAndIdNot("21CS001", "s1")).thenReturn(false);
        when(studentRepository.findById("s1")).thenReturn(Optional.of(existing));
        when(studentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Student result = studentService.updateStudent("s1", student("21CS001", ""));

        assertThat(result.getRegisterNumber()).isEqualTo("21CS001");
        assertThat(result.getEmail()).isNull();
    }

    /** Negative: updating a student that does not exist must say "not found", whatever the input. */
    @Test
    void updateOfMissingStudentReturnsNotFoundEvenIfRegisterNumberIsTaken() {
        lenient().when(studentRepository.existsByRegisterNumberAndIdNot("21CS001", "missing")).thenReturn(true);
        when(studentRepository.findById("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> studentService.updateStudent("missing", student("21CS001", null)))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    void updateToAnotherStudentsRegisterNumberIsRejected() {
        Student existing = student("21CS001", null);
        existing.setId("s1");
        lenient().when(studentRepository.findById("s1")).thenReturn(Optional.of(existing));
        when(studentRepository.existsByRegisterNumberAndIdNot("21CS002", "s1")).thenReturn(true);

        assertThatThrownBy(() -> studentService.updateStudent("s1", student("21CS002", null)))
                .isInstanceOf(ConflictException.class);
        verify(studentRepository, never()).save(any());
    }

    @Test
    void searchTrimsQueryAndMatchesNameOrRegisterNumber() {
        studentService.searchStudents("  21cs ");

        verify(studentRepository).findByNameContainingIgnoreCaseOrRegisterNumberContainingIgnoreCase("21cs", "21cs");
    }

    @Test
    void pagedSearchCombinesAllFilters() {
        Student a = student("21CS001", null);
        a.setName("Asha");
        Student b = student("21CS002", null);
        b.setName("Bala");
        b.setSemester(5);
        Student c = student("21ME003", null);
        c.setName("Chitra");
        c.setDepartment("Mechanical");
        Student legacy = student(null, null); // created before register numbers existed
        legacy.setName("Devi");
        when(studentRepository.findAll()).thenReturn(java.util.List.of(a, b, c, legacy));

        assertThat(studentService.getStudentPage(0, 10, null, null, null).totalElements()).isEqualTo(4);
        assertThat(studentService.getStudentPage(0, 10, " 21cs ", null, null).content()).containsExactly(a, b);
        assertThat(studentService.getStudentPage(0, 10, "CHI", null, null).content()).containsExactly(c);
        assertThat(studentService.getStudentPage(0, 10, null, "Mechanical", null).content()).containsExactly(c);
        assertThat(studentService.getStudentPage(0, 10, "21cs", "Computer Science", 5).content()).containsExactly(b);
        assertThat(studentService.getStudentPage(1, 3, null, null, null).content()).containsExactly(legacy);
    }

    @Test
    void deleteRemovesStudentsMarks() {
        when(studentRepository.existsById("s1")).thenReturn(true);

        studentService.deleteStudent("s1");

        verify(marksRepository).deleteByStudentId("s1");
        verify(attendanceRepository).deleteByStudentId("s1");
        verify(studentRepository).deleteById("s1");
    }

    @Test
    void deleteMissingStudentReturnsNotFound() {
        when(studentRepository.existsById("nope")).thenReturn(false);

        assertThatThrownBy(() -> studentService.deleteStudent("nope")).isInstanceOf(NotFoundException.class);
        verify(marksRepository, never()).deleteByStudentId(any());
    }
}
