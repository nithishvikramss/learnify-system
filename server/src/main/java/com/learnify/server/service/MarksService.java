package com.learnify.server.service;

import com.learnify.server.dto.MarksDetailDTO;
import com.learnify.server.dto.MarksUpdateRequest;
import com.learnify.server.dto.PageResponse;
import com.learnify.server.entity.Marks;
import com.learnify.server.entity.Student;
import com.learnify.server.entity.Subject;
import com.learnify.server.exception.BadRequestException;
import com.learnify.server.exception.NotFoundException;
import com.learnify.server.repository.MarksRepository;
import com.learnify.server.repository.StudentRepository;
import com.learnify.server.repository.SubjectRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class MarksService {

    private final MarksRepository marksRepository;
    private final StudentRepository studentRepository;
    private final SubjectRepository subjectRepository;

    public MarksService(MarksRepository marksRepository,
                        StudentRepository studentRepository,
                        SubjectRepository subjectRepository) {
        this.marksRepository = marksRepository;
        this.studentRepository = studentRepository;
        this.subjectRepository = subjectRepository;
    }

    /**
     * Saves marks for a student-subject pair, updating the existing record if there is one.
     * (Previously used Optional.orElse(save(...)), which always inserted a new record.)
     */
    public Marks addOrUpdateMarks(Marks marks) {
        if (!studentRepository.existsById(marks.getStudentId())) {
            throw new NotFoundException("Student not found");
        }
        Subject subject = subjectRepository.findById(marks.getSubjectId())
                .orElseThrow(() -> new NotFoundException("Subject not found"));
        checkWithinMaxMarks(marks.getInternalMarks(), marks.getExternalMarks(), subject);

        List<Marks> existing = marksRepository.findAllByStudentIdAndSubjectId(
                marks.getStudentId(), marks.getSubjectId());
        Marks target = existing.isEmpty() ? new Marks() : existing.get(0);
        if (existing.size() > 1) {
            // Clean up duplicates created by the old bug
            marksRepository.deleteAll(existing.subList(1, existing.size()));
        }

        target.setStudentId(marks.getStudentId());
        target.setSubjectId(marks.getSubjectId());
        target.setInternalMarks(marks.getInternalMarks());
        target.setExternalMarks(marks.getExternalMarks());
        target.setMaxMarks(subject.getMaxMarks());
        return marksRepository.save(target);
    }

    public Marks updateMarks(String id, MarksUpdateRequest request) {
        Marks marks = marksRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Marks record not found"));
        Subject subject = subjectRepository.findById(marks.getSubjectId())
                .orElseThrow(() -> new NotFoundException("Subject not found"));
        checkWithinMaxMarks(request.internalMarks(), request.externalMarks(), subject);

        marks.setInternalMarks(request.internalMarks());
        marks.setExternalMarks(request.externalMarks());
        marks.setMaxMarks(subject.getMaxMarks());
        return marksRepository.save(marks);
    }

    public void deleteMarks(String id) {
        if (!marksRepository.existsById(id)) {
            throw new NotFoundException("Marks record not found");
        }
        marksRepository.deleteById(id);
    }

    private void checkWithinMaxMarks(double internal, double external, Subject subject) {
        double total = internal + external;
        if (total > subject.getMaxMarks()) {
            throw new BadRequestException("Total marks (" + formatMarks(total) + ") cannot exceed the maximum of "
                    + subject.getMaxMarks() + " for " + subject.getName() + ".");
        }
    }

    private static String formatMarks(double value) {
        return value == Math.floor(value) ? String.valueOf((long) value) : String.valueOf(value);
    }

    public List<Marks> getAllMarks() {
        return marksRepository.findAll();
    }

    public List<Marks> getMarksByStudent(String studentId) {
        return marksRepository.findByStudentId(studentId);
    }

    public List<Marks> getMarksBySubject(String subjectId) {
        return marksRepository.findBySubjectId(subjectId);
    }

    public List<MarksDetailDTO> getAllMarksWithDetails() {
        List<Marks> allMarks = marksRepository.findAll();
        Map<String, Student> studentMap = studentRepository.findAll().stream()
                .collect(Collectors.toMap(Student::getId, Function.identity()));
        Map<String, Subject> subjectMap = subjectRepository.findAll().stream()
                .collect(Collectors.toMap(Subject::getId, Function.identity()));

        return allMarks.stream()
                .map(m -> buildDetail(m, studentMap, subjectMap))
                .collect(Collectors.toList());
    }

    /** Search (student name or register number), subject and result (pass/fail) combine; each is optional. */
    public PageResponse<MarksDetailDTO> getMarksPage(int page, int size, String search, String subjectId, String result) {
        if (result != null && !result.isBlank() && !result.equals("pass") && !result.equals("fail")) {
            throw new BadRequestException("result must be pass or fail.");
        }
        String q = search == null ? "" : search.trim().toLowerCase();
        List<MarksDetailDTO> matches = getAllMarksWithDetails().stream()
                .filter(m -> q.isEmpty() || contains(m.getStudentName(), q) || contains(m.getRegisterNumber(), q))
                .filter(m -> subjectId == null || subjectId.isBlank() || subjectId.equals(m.getSubjectId()))
                .filter(m -> result == null || result.isBlank() || result.equals("pass") == m.isPassed())
                .toList();
        return PageResponse.of(matches, page, size);
    }

    private static boolean contains(String value, String lowerCaseQuery) {
        return value != null && value.toLowerCase().contains(lowerCaseQuery);
    }

    public List<MarksDetailDTO> getMarksByStudentWithDetails(String studentId) {
        List<Marks> marks = marksRepository.findByStudentId(studentId);
        Map<String, Student> studentMap = studentRepository.findAll().stream()
                .collect(Collectors.toMap(Student::getId, Function.identity()));
        Map<String, Subject> subjectMap = subjectRepository.findAll().stream()
                .collect(Collectors.toMap(Subject::getId, Function.identity()));

        return marks.stream()
                .map(m -> buildDetail(m, studentMap, subjectMap))
                .collect(Collectors.toList());
    }

    private MarksDetailDTO buildDetail(Marks m,
                                       Map<String, Student> studentMap,
                                       Map<String, Subject> subjectMap) {
        MarksDetailDTO dto = new MarksDetailDTO();
        dto.setMarksId(m.getId());
        dto.setStudentId(m.getStudentId());
        dto.setSubjectId(m.getSubjectId());
        dto.setInternalMarks(m.getInternalMarks());
        dto.setExternalMarks(m.getExternalMarks());
        dto.setTotalMarks(m.getTotalMarks());
        dto.setMaxMarks(m.effectiveMaxMarks());
        dto.setPassed(m.isPassed());
        dto.setPercentage(Math.round(m.getPercentage() * 100.0) / 100.0);

        Student student = studentMap.get(m.getStudentId());
        if (student != null) {
            dto.setStudentName(student.getName());
            dto.setRegisterNumber(student.getRegisterNumber());
            dto.setDepartment(student.getDepartment());
            dto.setSemester(student.getSemester());
        }

        Subject subject = subjectMap.get(m.getSubjectId());
        if (subject != null) {
            dto.setSubjectName(subject.getName());
        }

        return dto;
    }
}
