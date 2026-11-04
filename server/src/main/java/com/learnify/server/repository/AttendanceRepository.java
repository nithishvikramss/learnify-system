package com.learnify.server.repository;

import com.learnify.server.entity.Attendance;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttendanceRepository extends MongoRepository<Attendance, String> {
    List<Attendance> findBySubjectIdAndDate(String subjectId, String date);
    List<Attendance> findByStudentId(String studentId);
    long countBySubjectId(String subjectId);
    void deleteByStudentId(String studentId);
    void deleteBySubjectId(String subjectId);
}
