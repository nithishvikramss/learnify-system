package com.learnify.server.service;

import com.learnify.server.dto.PageResponse;
import com.learnify.server.entity.Student;
import com.learnify.server.exception.ConflictException;
import com.learnify.server.exception.NotFoundException;
import com.learnify.server.repository.MarksRepository;
import com.learnify.server.repository.StudentRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class StudentService {

    private final StudentRepository studentRepository;
    private final MarksRepository marksRepository;

    public StudentService(StudentRepository studentRepository, MarksRepository marksRepository) {
        this.studentRepository = studentRepository;
        this.marksRepository = marksRepository;
    }

    public Student addStudent(Student student) {
        student.setId(null); // never let the client choose/overwrite an id
        normalize(student);
        if (studentRepository.existsByRegisterNumber(student.getRegisterNumber())) {
            throw new ConflictException("Register number " + student.getRegisterNumber() + " is already in use.");
        }
        if (student.getEmail() != null && studentRepository.existsByEmail(student.getEmail())) {
            throw new ConflictException("Email " + student.getEmail() + " is already in use.");
        }
        return studentRepository.save(student);
    }

    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    public Optional<Student> getStudentById(String id) {
        return studentRepository.findById(id);
    }

    public List<Student> getStudentsByDepartment(String department) {
        return studentRepository.findByDepartment(department);
    }

    /** Searches by (partial) name or register number. */
    public List<Student> searchStudents(String query) {
        String q = query.trim();
        return studentRepository.findByNameContainingIgnoreCaseOrRegisterNumberContainingIgnoreCase(q, q);
    }

    /** Search, department and semester combine; each is optional. */
    public PageResponse<Student> getStudentPage(int page, int size, String search, String department, Integer semester) {
        String q = search == null ? "" : search.trim().toLowerCase();
        List<Student> matches = studentRepository.findAll().stream()
                .filter(s -> q.isEmpty() || contains(s.getName(), q) || contains(s.getRegisterNumber(), q))
                .filter(s -> department == null || department.isBlank() || department.equals(s.getDepartment()))
                .filter(s -> semester == null || semester == s.getSemester())
                .toList();
        return PageResponse.of(matches, page, size);
    }

    private static boolean contains(String value, String lowerCaseQuery) {
        return value != null && value.toLowerCase().contains(lowerCaseQuery);
    }

    public Student updateStudent(String id, Student updated) {
        Student existing = studentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Student not found"));
        normalize(updated);
        if (studentRepository.existsByRegisterNumberAndIdNot(updated.getRegisterNumber(), id)) {
            throw new ConflictException("Register number " + updated.getRegisterNumber() + " is already in use.");
        }
        if (updated.getEmail() != null && studentRepository.existsByEmailAndIdNot(updated.getEmail(), id)) {
            throw new ConflictException("Email " + updated.getEmail() + " is already in use.");
        }
        existing.setName(updated.getName());
        existing.setRegisterNumber(updated.getRegisterNumber());
        existing.setDepartment(updated.getDepartment());
        existing.setSemester(updated.getSemester());
        existing.setEmail(updated.getEmail());
        return studentRepository.save(existing);
    }

    public void deleteStudent(String id) {
        if (!studentRepository.existsById(id)) {
            throw new NotFoundException("Student not found");
        }
        marksRepository.deleteByStudentId(id);
        studentRepository.deleteById(id);
    }

    public long getTotalCount() {
        return studentRepository.count();
    }

    /** Trims input and stores register numbers upper-case and emails lower-case so uniqueness checks are reliable. */
    private static void normalize(Student s) {
        s.setName(s.getName().trim());
        s.setRegisterNumber(s.getRegisterNumber().trim().toUpperCase());
        s.setDepartment(s.getDepartment().trim());
        String email = s.getEmail() == null ? "" : s.getEmail().trim().toLowerCase();
        s.setEmail(email.isEmpty() ? null : email);
    }
}
