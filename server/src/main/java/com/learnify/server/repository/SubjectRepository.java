package com.learnify.server.repository;

import com.learnify.server.entity.Subject;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SubjectRepository extends MongoRepository<Subject, String> {
    Optional<Subject> findByCode(String code);
    Optional<Subject> findByName(String name);
    boolean existsByCode(String code);
    boolean existsByCodeAndIdNot(String code, String id);
}
