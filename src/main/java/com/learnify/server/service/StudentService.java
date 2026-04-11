package com.learnify.server.service;

import com.learnify.server.entity.Student;
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

    public List<Student> searchStudents(String name) {
        return studentRepository.findByNameContainingIgnoreCase(name);
    }

    public Student updateStudent(String id, Student updated) {
        return studentRepository.findById(id).map(existing -> {
            existing.setName(updated.getName());
            existing.setDepartment(updated.getDepartment());
            existing.setSemester(updated.getSemester());
            existing.setEmail(updated.getEmail());
            return studentRepository.save(existing);
        }).orElseThrow(() -> new RuntimeException("Student not found: " + id));
    }

    public void deleteStudent(String id) {
        marksRepository.deleteByStudentId(id);
        studentRepository.deleteById(id);
    }

    public long getTotalCount() {
        return studentRepository.count();
    }
}
