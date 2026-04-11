package com.learnify.server.repository;

import com.learnify.server.entity.Marks;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MarksRepository extends MongoRepository<Marks, String> {
    List<Marks> findByStudentId(String studentId);
    List<Marks> findBySubjectId(String subjectId);
    Optional<Marks> findByStudentIdAndSubjectId(String studentId, String subjectId);
    void deleteByStudentId(String studentId);
}
