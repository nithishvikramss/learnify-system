package com.learnify.server.config;

import com.learnify.server.entity.Marks;
import com.learnify.server.entity.Student;
import com.learnify.server.entity.Subject;
import com.learnify.server.repository.MarksRepository;
import com.learnify.server.repository.StudentRepository;
import com.learnify.server.repository.SubjectRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DemoDataSeederTest {

    @Mock private StudentRepository studentRepository;
    @Mock private SubjectRepository subjectRepository;
    @Mock private MarksRepository marksRepository;
    @InjectMocks private DemoDataSeeder seeder;

    @Test
    void doesNothingWhenDataAlreadyExists() {
        when(studentRepository.count()).thenReturn(3L);

        seeder.run();

        verify(subjectRepository, never()).saveAll(any());
        verify(marksRepository, never()).saveAll(any());
    }

    @Test
    @SuppressWarnings("unchecked")
    void loadsValidDemoDataIntoEmptyDatabase() {
        AtomicInteger ids = new AtomicInteger();
        when(subjectRepository.saveAll(anyList())).thenAnswer(inv -> {
            List<Subject> list = inv.getArgument(0);
            list.forEach(s -> s.setId("sub" + ids.incrementAndGet()));
            return list;
        });
        when(studentRepository.saveAll(anyList())).thenAnswer(inv -> {
            List<Student> list = inv.getArgument(0);
            list.forEach(s -> s.setId("stu" + ids.incrementAndGet()));
            return list;
        });

        seeder.run();

        ArgumentCaptor<List<Marks>> captor = ArgumentCaptor.forClass(List.class);
        verify(marksRepository).saveAll(captor.capture());
        List<Marks> marks = captor.getValue();
        assertThat(marks).hasSize(20 * 5);
        assertThat(marks).allSatisfy(m -> {
            assertThat(m.getInternalMarks()).isGreaterThanOrEqualTo(0);
            assertThat(m.getExternalMarks()).isGreaterThanOrEqualTo(0);
            assertThat(m.getTotalMarks()).isLessThanOrEqualTo(m.getMaxMarks());
        });
        // The demo should show both passing and failing results
        assertThat(marks).anyMatch(Marks::isPassed);
        assertThat(marks).anyMatch(m -> !m.isPassed());
    }
}
