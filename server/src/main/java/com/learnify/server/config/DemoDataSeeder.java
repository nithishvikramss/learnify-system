package com.learnify.server.config;

import com.learnify.server.entity.Marks;
import com.learnify.server.entity.Student;
import com.learnify.server.entity.Subject;
import com.learnify.server.repository.MarksRepository;
import com.learnify.server.repository.StudentRepository;
import com.learnify.server.repository.SubjectRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * Loads a predictable demo dataset (5 subjects, 20 fictional students, marks for each)
 * when DEMO_DATA=true and the database has no students or subjects yet.
 * Existing data is never modified.
 */
@Component
@ConditionalOnProperty(name = "app.demo-data.enabled", havingValue = "true")
public class DemoDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);

    private static final String[][] STUDENTS = {
            {"Aarav Menon", "Computer Science"}, {"Diya Raman", "Computer Science"},
            {"Karthik Selvam", "Computer Science"}, {"Meera Iyer", "Computer Science"},
            {"Rohan Das", "Computer Science"}, {"Sneha Pillai", "Electronics"},
            {"Vikram Rao", "Electronics"}, {"Ananya Krishnan", "Electronics"},
            {"Harish Kumar", "Electronics"}, {"Lakshmi Narayan", "Electronics"},
            {"Arjun Prakash", "Mechanical"}, {"Kavya Suresh", "Mechanical"},
            {"Naveen Shankar", "Mechanical"}, {"Pooja Venkat", "Mechanical"},
            {"Siddharth Bala", "Civil"}, {"Tara Gopal", "Civil"},
            {"Varun Mohan", "Civil"}, {"Nila Arumugam", "Mathematics"},
            {"Ishaan Reddy", "Mathematics"}, {"Priya Natarajan", "Mathematics"},
    };

    private final StudentRepository studentRepository;
    private final SubjectRepository subjectRepository;
    private final MarksRepository marksRepository;

    public DemoDataSeeder(StudentRepository studentRepository, SubjectRepository subjectRepository,
                          MarksRepository marksRepository) {
        this.studentRepository = studentRepository;
        this.subjectRepository = subjectRepository;
        this.marksRepository = marksRepository;
    }

    @Override
    public void run(String... args) {
        if (studentRepository.count() > 0 || subjectRepository.count() > 0) {
            log.info("Demo data skipped: database already contains students or subjects.");
            return;
        }

        List<Subject> subjects = subjectRepository.saveAll(List.of(
                new Subject("Engineering Mathematics", "MA201", 100),
                new Subject("Data Structures", "CS202", 100),
                new Subject("Digital Electronics", "EC203", 100),
                new Subject("Engineering Physics", "PH204", 100),
                new Subject("Programming Lab", "CS205L", 50)));

        List<Student> students = new ArrayList<>();
        for (int i = 0; i < STUDENTS.length; i++) {
            Student s = new Student(STUDENTS[i][0], STUDENTS[i][1], i % 2 == 0 ? 3 : 5,
                    STUDENTS[i][0].toLowerCase().replace(' ', '.') + "@example.edu");
            s.setRegisterNumber(String.format("23SMS%03d", i + 1));
            students.add(s);
        }
        students = studentRepository.saveAll(students);

        // Fixed seed so every demo shows the same numbers; a few students are deliberately weak.
        Random random = new Random(2026);
        List<Marks> marks = new ArrayList<>();
        for (int i = 0; i < students.size(); i++) {
            double ability = i % 7 == 6 ? 0.30 : 0.45 + random.nextDouble() * 0.5;
            for (Subject subject : subjects) {
                double max = subject.getMaxMarks();
                double score = Math.min(max, Math.max(0, Math.round(max * (ability + (random.nextDouble() - 0.5) * 0.2))));
                double internal = Math.round(score * 0.4);
                Marks m = new Marks(students.get(i).getId(), subject.getId(), internal, score - internal);
                m.setMaxMarks(max);
                marks.add(m);
            }
        }
        marksRepository.saveAll(marks);
        log.info("Demo data loaded: {} subjects, {} students, {} marks records.",
                subjects.size(), students.size(), marks.size());
    }
}
