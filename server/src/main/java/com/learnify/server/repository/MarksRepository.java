package com.learnify.server.repository;

import com.learnify.server.entity.Marks;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MarksRepository extends MongoRepository<Marks, String> {
    List<Marks> findByStudentId(String studentId);
    List<Marks> findBySubjectId(String subjectId);
    List<Marks> findAllByStudentIdAndSubjectId(String studentId, String subjectId);
    long countBySubjectId(String subjectId);
    void deleteByStudentId(String studentId);
    void deleteBySubjectId(String subjectId);
}
