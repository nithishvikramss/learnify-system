package com.learnify.server.service;

import com.learnify.server.entity.Marks;
import com.learnify.server.entity.Subject;
import com.learnify.server.exception.BadRequestException;
import com.learnify.server.exception.ConflictException;
import com.learnify.server.exception.NotFoundException;
import com.learnify.server.repository.AttendanceRepository;
import com.learnify.server.repository.MarksRepository;
import com.learnify.server.repository.SubjectRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class SubjectService {

    private final SubjectRepository subjectRepository;
    private final MarksRepository marksRepository;
    private final AttendanceRepository attendanceRepository;

    public SubjectService(SubjectRepository subjectRepository, MarksRepository marksRepository,
                          AttendanceRepository attendanceRepository) {
        this.subjectRepository = subjectRepository;
        this.marksRepository = marksRepository;
        this.attendanceRepository = attendanceRepository;
    }

    public Subject addSubject(Subject subject) {
        subject.setId(null); // never let the client choose/overwrite an id
        normalize(subject);
        if (subjectRepository.existsByCode(subject.getCode())) {
            throw new ConflictException("Subject code " + subject.getCode() + " already exists.");
        }
        return subjectRepository.save(subject);
    }

    public List<Subject> getAllSubjects() {
        return subjectRepository.findAll();
    }

    public Optional<Subject> getSubjectById(String id) {
        return subjectRepository.findById(id);
    }

    /**
     * Updates a subject. If max marks change, existing marks are re-scaled to the new maximum;
     * lowering the maximum below a mark that is already recorded is rejected.
     */
    public Subject updateSubject(String id, Subject updated) {
        Subject existing = subjectRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Subject not found"));
        normalize(updated);
        if (subjectRepository.existsByCodeAndIdNot(updated.getCode(), id)) {
            throw new ConflictException("Subject code " + updated.getCode() + " already exists.");
        }

        if (updated.getMaxMarks() != existing.getMaxMarks()) {
            List<Marks> marks = marksRepository.findBySubjectId(id);
            long tooHigh = marks.stream().filter(m -> m.getTotalMarks() > updated.getMaxMarks()).count();
            if (tooHigh > 0) {
                throw new BadRequestException(tooHigh + " student(s) already have marks above "
                        + updated.getMaxMarks() + ". Update their marks first.");
            }
            marks.forEach(m -> m.setMaxMarks(updated.getMaxMarks()));
            marksRepository.saveAll(marks);
        }

        existing.setName(updated.getName());
        existing.setCode(updated.getCode());
        existing.setMaxMarks(updated.getMaxMarks());
        return subjectRepository.save(existing);
    }

    /**
     * Deletes a subject. If marks or attendance exist for it, deletion is refused unless {@code cascade}
     * is true, in which case those records are deleted too (so no orphans remain).
     */
    public void deleteSubject(String id, boolean cascade) {
        if (!subjectRepository.existsById(id)) {
            throw new NotFoundException("Subject not found");
        }
        long marksCount = marksRepository.countBySubjectId(id);
        long attendanceCount = attendanceRepository.countBySubjectId(id);
        if ((marksCount > 0 || attendanceCount > 0) && !cascade) {
            throw new ConflictException("This subject has " + marksCount + " marks record(s) and "
                    + attendanceCount + " attendance record(s). Delete the subject together with them?");
        }
        marksRepository.deleteBySubjectId(id);
        attendanceRepository.deleteBySubjectId(id);
        subjectRepository.deleteById(id);
    }

    public long getTotalCount() {
        return subjectRepository.count();
    }

    private static void normalize(Subject subject) {
        subject.setName(subject.getName().trim());
        subject.setCode(subject.getCode().trim().toUpperCase());
    }
}
