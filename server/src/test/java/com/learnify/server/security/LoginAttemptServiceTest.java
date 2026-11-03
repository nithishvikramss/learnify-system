package com.learnify.server.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;

/** Boundary tests for login lockout (TEST_CASES.md: AUTH-B-*). */
class LoginAttemptServiceTest {

    /** A clock the test can move forward. */
    static class MutableClock extends Clock {
        Instant now = Instant.parse("2026-11-03T10:00:00Z");
        void advance(Duration d) { now = now.plus(d); }
        @Override public ZoneId getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(ZoneId zone) { return this; }
        @Override public Instant instant() { return now; }
    }

    private MutableClock clock;
    private LoginAttemptService service;

    @BeforeEach
    void setUp() {
        clock = new MutableClock();
        service = new LoginAttemptService(clock);
    }

    private void fail(int times) {
        for (int i = 0; i < times; i++) service.recordFailure("admin");
    }

    @Test
    void fourFailuresDoNotLock() {
        fail(4);
        assertThat(service.isLocked("admin")).isFalse();
    }

    @Test
    void fifthFailureLocks() {
        fail(5);
        assertThat(service.isLocked("admin")).isTrue();
    }

    @Test
    void lockIsPerUsername() {
        fail(5);
        assertThat(service.isLocked("teacher")).isFalse();
    }

    @Test
    void stillLockedJustBeforeFifteenMinutes() {
        fail(5);
        clock.advance(Duration.ofMinutes(15));
        assertThat(service.isLocked("admin")).isTrue();
    }

    @Test
    void unlockedAfterFifteenMinutesAndCounterReset() {
        fail(5);
        clock.advance(Duration.ofMinutes(15).plusSeconds(1));
        assertThat(service.isLocked("admin")).isFalse();
        fail(1);
        assertThat(service.isLocked("admin")).isFalse();
    }

    @Test
    void successResetsFailureCount() {
        fail(4);
        service.recordSuccess("admin");
        fail(4);
        assertThat(service.isLocked("admin")).isFalse();
    }

    /**
     * Requirement (TEST_PLAN.md §2): lock after 5 failures within a 15-minute window.
     * Old failures (e.g. one typo a day) must not add up to a lockout.
     */
    @Test
    void failuresOlderThanTheWindowAreForgotten() {
        fail(4);
        clock.advance(Duration.ofMinutes(16));
        fail(1);
        assertThat(service.isLocked("admin")).isFalse();
    }
}
