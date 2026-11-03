package com.learnify.server.config;

import com.learnify.server.entity.Role;
import com.learnify.server.entity.User;
import com.learnify.server.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** Initial account creation (TEST_CASES.md: AUTH-P-07, AUTH-B-07/08). */
@ExtendWith(MockitoExtension.class)
class UserSeederTest {

    @Mock private UserRepository userRepository;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    private UserSeeder seeder(String adminPw, String teacherPw) {
        UserSeeder s = new UserSeeder(userRepository, encoder);
        ReflectionTestUtils.setField(s, "adminUsername", " Admin ");
        ReflectionTestUtils.setField(s, "adminPassword", adminPw);
        ReflectionTestUtils.setField(s, "teacherUsername", "teacher");
        ReflectionTestUtils.setField(s, "teacherPassword", teacherPw);
        return s;
    }

    @Test
    void createsBothAccountsWithHashedPasswords() {
        seeder("Admin#2026", "Teach#2026").run();

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository, times(2)).save(captor.capture());
        List<User> users = captor.getAllValues();
        User admin = users.get(0);
        assertThat(admin.getUsername()).isEqualTo("admin");
        assertThat(admin.getRole()).isEqualTo(Role.ADMIN);
        assertThat(admin.getPasswordHash()).isNotEqualTo("Admin#2026");
        assertThat(encoder.matches("Admin#2026", admin.getPasswordHash())).isTrue();
        assertThat(users.get(1).getRole()).isEqualTo(Role.TEACHER);
    }

    @Test
    void existingAccountsAreNotOverwritten() {
        when(userRepository.existsByUsername(any())).thenReturn(true);

        seeder("Admin#2026", "Teach#2026").run();

        verify(userRepository, never()).save(any());
    }

    @Test
    void passwordOf8CharsAcceptedAnd7Skipped() {
        seeder("12345678", "1234567").run();

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository, times(1)).save(captor.capture());
        assertThat(captor.getValue().getRole()).isEqualTo(Role.ADMIN);
    }

    @Test
    void missingPasswordsCreateNoAccounts() {
        seeder("", null).run();

        verify(userRepository, never()).save(any());
    }
}
