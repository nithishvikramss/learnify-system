package com.learnify.server.service;

import com.learnify.server.dto.MarksDetailDTO;
import com.learnify.server.entity.Marks;
import com.learnify.server.entity.Student;
import com.learnify.server.entity.Subject;
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

    public Marks addOrUpdateMarks(Marks marks) {
        // Auto-calculate totalMarks
        marks.setTotalMarks(marks.getInternalMarks() + marks.getExternalMarks());

        // Check if marks already exist for this student-subject pair
        return marksRepository.findByStudentIdAndSubjectId(marks.getStudentId(), marks.getSubjectId())
                .map(existing -> {
                    existing.setInternalMarks(marks.getInternalMarks());
                    existing.setExternalMarks(marks.getExternalMarks());
                    existing.setTotalMarks(marks.getTotalMarks());
                    return marksRepository.save(existing);
                })
                .orElse(marksRepository.save(marks));
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
        dto.setPassed(m.getTotalMarks() >= Marks.PASS_MARK);
        dto.setPercentage(Math.round((m.getTotalMarks() / Marks.MAX_MARKS) * 100.0 * 100.0) / 100.0);

        Student student = studentMap.get(m.getStudentId());
        if (student != null) {
            dto.setStudentName(student.getName());
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
