package com.learnify.server.repository;

import com.learnify.server.entity.Student;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudentRepository extends MongoRepository<Student, String> {
    List<Student> findByDepartment(String department);
    List<Student> findBySemester(int semester);
    List<Student> findByNameContainingIgnoreCase(String name);
    List<Student> findByNameContainingIgnoreCaseOrRegisterNumberContainingIgnoreCase(String name, String registerNumber);
    boolean existsByRegisterNumber(String registerNumber);
    boolean existsByRegisterNumberAndIdNot(String registerNumber, String id);
    boolean existsByEmail(String email);
    boolean existsByEmailAndIdNot(String email, String id);
}
