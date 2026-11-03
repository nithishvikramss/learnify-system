package com.learnify.server.security;

import com.learnify.server.entity.Role;
import com.learnify.server.entity.User;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private static final String SECRET = "test-secret-that-is-definitely-longer-than-32-bytes";
    private final User teacher = new User("teacher", "hash", "Teacher", Role.TEACHER);

    @Test
    void tokenRoundTripKeepsUsernameAndRole() {
        JwtService jwt = new JwtService(SECRET, 60);

        var user = jwt.verify(jwt.generateToken(teacher)).orElseThrow();

        assertThat(user.username()).isEqualTo("teacher");
        assertThat(user.role()).isEqualTo(Role.TEACHER);
    }

    @Test
    void tokenSignedWithAnotherKeyIsRejected() {
        String token = new JwtService("another-secret-that-is-also-longer-than-32-bytes", 60).generateToken(teacher);

        assertThat(new JwtService(SECRET, 60).verify(token)).isEmpty();
    }

    @Test
    void expiredTokenIsRejected() {
        JwtService jwt = new JwtService(SECRET, -1); // already expired when issued

        assertThat(jwt.verify(jwt.generateToken(teacher))).isEmpty();
    }

    @Test
    void secretOfExactly32BytesIsUsedAsIs() {
        String secret32 = "a".repeat(32);
        String token = new JwtService(secret32, 60).generateToken(teacher);

        // Two services with the same 32-byte secret accept each other's tokens
        assertThat(new JwtService(secret32, 60).verify(token)).isPresent();
    }

    @Test
    void secretOf31BytesFallsBackToRandomKey() {
        String secret31 = "a".repeat(31);
        String token = new JwtService(secret31, 60).generateToken(teacher);

        // Too-short secret is not used; each instance gets its own random key
        assertThat(new JwtService(secret31, 60).verify(token)).isEmpty();
    }

    @Test
    void emptyOrNullTokenIsRejected() {
        JwtService jwt = new JwtService(SECRET, 60);
        assertThat(jwt.verify("")).isEmpty();
        assertThat(jwt.verify(null)).isEmpty();
    }

    @Test
    void garbageIsRejected() {
        assertThat(new JwtService(SECRET, 60).verify("not-a-jwt")).isEmpty();
    }
}
