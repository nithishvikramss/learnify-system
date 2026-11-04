package com.learnify.server.service;

import com.learnify.server.dto.AttendanceSheetRequest;
import com.learnify.server.dto.AttendanceSummaryDTO;
import com.learnify.server.entity.Attendance;
import com.learnify.server.entity.Subject;
import com.learnify.server.exception.BadRequestException;
import com.learnify.server.exception.NotFoundException;
import com.learnify.server.repository.AttendanceRepository;
import com.learnify.server.repository.StudentRepository;
import com.learnify.server.repository.SubjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class AttendanceService {

    /** Below this percentage a student is flagged on reports. */
    public static final double MINIMUM_PERCENTAGE = 75.0;

    private final AttendanceRepository attendanceRepository;
    private final StudentRepository studentRepository;
    private final SubjectRepository subjectRepository;
    private final Clock clock;

    @Autowired
    public AttendanceService(AttendanceRepository attendanceRepository, StudentRepository studentRepository,
                             SubjectRepository subjectRepository) {
        this(attendanceRepository, studentRepository, subjectRepository, Clock.systemDefaultZone());
    }

    AttendanceService(AttendanceRepository attendanceRepository, StudentRepository studentRepository,
                      SubjectRepository subjectRepository, Clock clock) {
        this.attendanceRepository = attendanceRepository;
        this.studentRepository = studentRepository;
        this.subjectRepository = subjectRepository;
        this.clock = clock;
    }

    public List<Attendance> getSheet(String subjectId, LocalDate date) {
        return attendanceRepository.findBySubjectIdAndDate(subjectId, date.toString());
    }

    /** Saves a subject's attendance for a date. Saving the same date again updates it, never duplicates. */
    public List<Attendance> saveSheet(AttendanceSheetRequest request) {
        if (request.date().isAfter(LocalDate.now(clock))) {
            throw new BadRequestException("Attendance cannot be recorded for a future date.");
        }
        if (!subjectRepository.existsById(request.subjectId())) {
            throw new NotFoundException("Subject not found");
        }
        Set<String> studentIds = request.entries().stream()
                .map(AttendanceSheetRequest.Entry::studentId).collect(Collectors.toSet());
        if (studentIds.size() != request.entries().size()) {
            throw new BadRequestException("A student appears more than once.");
        }
        Set<String> known = new HashSet<>();
        studentRepository.findAllById(studentIds).forEach(s -> known.add(s.getId()));
        if (!known.containsAll(studentIds)) {
            throw new NotFoundException("Student not found");
        }

        String date = request.date().toString();
        Map<String, Attendance> existing = attendanceRepository.findBySubjectIdAndDate(request.subjectId(), date).stream()
                .collect(Collectors.toMap(Attendance::getStudentId, Function.identity(), (first, second) -> first));
        List<Attendance> records = new ArrayList<>();
        for (AttendanceSheetRequest.Entry entry : request.entries()) {
            Attendance record = existing.get(entry.studentId());
            if (record == null) {
                record = new Attendance(entry.studentId(), request.subjectId(), date, entry.present());
            } else {
                record.setPresent(entry.present());
            }
            records.add(record);
        }
        return attendanceRepository.saveAll(records);
    }

    public List<AttendanceSummaryDTO> getStudentSummary(String studentId) {
        if (!studentRepository.existsById(studentId)) {
            throw new NotFoundException("Student not found");
        }
        Map<String, String> subjectNames = subjectRepository.findAll().stream()
                .collect(Collectors.toMap(Subject::getId, Subject::getName));
        return attendanceRepository.findByStudentId(studentId).stream()
                .collect(Collectors.groupingBy(Attendance::getSubjectId))
                .entrySet().stream()
                .map(e -> {
                    int total = e.getValue().size();
                    int attended = (int) e.getValue().stream().filter(Attendance::isPresent).count();
                    double percentage = Math.round(attended * 10000.0 / total) / 100.0;
                    return new AttendanceSummaryDTO(e.getKey(), subjectNames.getOrDefault(e.getKey(), "Unknown"),
                            attended, total, percentage, percentage < MINIMUM_PERCENTAGE);
                })
                .sorted(Comparator.comparing(AttendanceSummaryDTO::subjectName))
                .toList();
    }
}
