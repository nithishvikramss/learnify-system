package com.learnify.server.service;

import com.learnify.server.dto.AttendanceSheetRequest;
import com.learnify.server.dto.AttendanceSheetRequest.Entry;
import com.learnify.server.dto.AttendanceSummaryDTO;
import com.learnify.server.entity.Attendance;
import com.learnify.server.entity.Student;
import com.learnify.server.entity.Subject;
import com.learnify.server.exception.BadRequestException;
import com.learnify.server.exception.NotFoundException;
import com.learnify.server.repository.AttendanceRepository;
import com.learnify.server.repository.StudentRepository;
import com.learnify.server.repository.SubjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AttendanceServiceTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 11, 4);

    @Mock private AttendanceRepository attendanceRepository;
    @Mock private StudentRepository studentRepository;
    @Mock private SubjectRepository subjectRepository;
    private AttendanceService service;

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(Instant.parse("2026-11-04T06:00:00Z"), ZoneOffset.UTC);
        service = new AttendanceService(attendanceRepository, studentRepository, subjectRepository, clock);
    }

    private static Student student(String id) {
        Student s = new Student("S " + id, "Civil", 1, null);
        s.setId(id);
        return s;
    }

    private void subjectAndStudentsExist(String... ids) {
        when(subjectRepository.existsById("sub1")).thenReturn(true);
        when(studentRepository.findAllById(any())).thenReturn(java.util.Arrays.stream(ids).map(AttendanceServiceTest::student).toList());
        when(attendanceRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    @SuppressWarnings("unchecked")
    private List<Attendance> saved() {
        ArgumentCaptor<List<Attendance>> captor = ArgumentCaptor.forClass(List.class);
        verify(attendanceRepository).saveAll(captor.capture());
        return captor.getValue();
    }

    @Test
    void firstSaveCreatesARecordPerStudent() {
        subjectAndStudentsExist("s1", "s2");
        when(attendanceRepository.findBySubjectIdAndDate("sub1", "2026-11-04")).thenReturn(List.of());

        service.saveSheet(new AttendanceSheetRequest("sub1", TODAY, List.of(new Entry("s1", true), new Entry("s2", false))));

        assertThat(saved()).extracting(Attendance::getStudentId, Attendance::getDate, Attendance::isPresent)
                .containsExactly(org.assertj.core.groups.Tuple.tuple("s1", "2026-11-04", true),
                        org.assertj.core.groups.Tuple.tuple("s2", "2026-11-04", false));
    }

    @Test
    void savingTheSameDateAgainUpdatesInsteadOfDuplicating() {
        subjectAndStudentsExist("s1");
        Attendance existing = new Attendance("s1", "sub1", "2026-11-04", false);
        existing.setId("a1");
        when(attendanceRepository.findBySubjectIdAndDate("sub1", "2026-11-04")).thenReturn(List.of(existing));

        service.saveSheet(new AttendanceSheetRequest("sub1", TODAY, List.of(new Entry("s1", true))));

        List<Attendance> records = saved();
        assertThat(records).hasSize(1);
        assertThat(records.get(0).getId()).isEqualTo("a1");
        assertThat(records.get(0).isPresent()).isTrue();
    }

    @Test
    void todayIsAllowedButTomorrowIsRejected() {
        assertThatThrownBy(() -> service.saveSheet(new AttendanceSheetRequest("sub1", TODAY.plusDays(1), List.of(new Entry("s1", true)))))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("future");
        verify(attendanceRepository, never()).saveAll(any());

        subjectAndStudentsExist("s1");
        service.saveSheet(new AttendanceSheetRequest("sub1", TODAY, List.of(new Entry("s1", true))));
        verify(attendanceRepository).saveAll(any());
    }

    @Test
    void unknownSubjectOrStudentIsRejected() {
        when(subjectRepository.existsById("ghost")).thenReturn(false);
        assertThatThrownBy(() -> service.saveSheet(new AttendanceSheetRequest("ghost", TODAY, List.of(new Entry("s1", true)))))
                .isInstanceOf(NotFoundException.class).hasMessage("Subject not found");

        when(subjectRepository.existsById("sub1")).thenReturn(true);
        when(studentRepository.findAllById(any())).thenReturn(List.of());
        assertThatThrownBy(() -> service.saveSheet(new AttendanceSheetRequest("sub1", TODAY, List.of(new Entry("s1", true)))))
                .isInstanceOf(NotFoundException.class).hasMessage("Student not found");
    }

    @Test
    void sameStudentTwiceIsRejected() {
        when(subjectRepository.existsById("sub1")).thenReturn(true);

        assertThatThrownBy(() -> service.saveSheet(new AttendanceSheetRequest("sub1", TODAY, List.of(new Entry("s1", true), new Entry("s1", false)))))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void summaryCalculatesPercentageAndFlagsBelow75() {
        Subject maths = new Subject("Maths", "MA1", 100);
        maths.setId("ma");
        Subject physics = new Subject("Physics", "PH1", 100);
        physics.setId("ph");
        when(studentRepository.existsById("s1")).thenReturn(true);
        when(subjectRepository.findAll()).thenReturn(List.of(maths, physics));
        when(attendanceRepository.findByStudentId("s1")).thenReturn(List.of(
                // Maths: exactly 3 of 4 = 75% (not flagged)
                new Attendance("s1", "ma", "2026-11-01", true), new Attendance("s1", "ma", "2026-11-02", true),
                new Attendance("s1", "ma", "2026-11-03", true), new Attendance("s1", "ma", "2026-11-04", false),
                // Physics: 2 of 3 = 66.67% (flagged)
                new Attendance("s1", "ph", "2026-11-01", true), new Attendance("s1", "ph", "2026-11-02", true),
                new Attendance("s1", "ph", "2026-11-03", false)));

        List<AttendanceSummaryDTO> summary = service.getStudentSummary("s1");

        assertThat(summary).extracting(AttendanceSummaryDTO::subjectName).containsExactly("Maths", "Physics");
        assertThat(summary.get(0).percentage()).isEqualTo(75.0);
        assertThat(summary.get(0).belowMinimum()).isFalse();
        assertThat(summary.get(1).percentage()).isEqualTo(66.67);
        assertThat(summary.get(1).belowMinimum()).isTrue();
    }

    @Test
    void summaryForUnknownStudentIsNotFound() {
        when(studentRepository.existsById("ghost")).thenReturn(false);

        assertThatThrownBy(() -> service.getStudentSummary("ghost")).isInstanceOf(NotFoundException.class);
    }
}
