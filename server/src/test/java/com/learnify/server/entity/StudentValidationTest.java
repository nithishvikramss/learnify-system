package com.learnify.server.entity;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

/** Boundary-value tests for the Student input rules (TEST_CASES.md: STU-B-*). */
class StudentValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUp() {
        validator = Validation.buildDefaultValidatorFactory().getValidator();
    }

    private static Student valid() {
        Student s = new Student("Arun Kumar", "Computer Science", 3, "arun@example.com");
        s.setRegisterNumber("21CS001");
        return s;
    }

    private static Set<String> invalidFields(Student s) {
        return validator.validate(s).stream()
                .map(ConstraintViolation::getPropertyPath).map(Object::toString)
                .collect(Collectors.toSet());
    }

    @Test
    void validStudentHasNoViolations() {
        assertThat(invalidFields(valid())).isEmpty();
    }

    @ParameterizedTest(name = "semester {0} is accepted")
    @ValueSource(ints = {1, 8})
    void semesterLowerAndUpperBoundsAccepted(int semester) {
        Student s = valid();
        s.setSemester(semester);
        assertThat(invalidFields(s)).isEmpty();
    }

    @ParameterizedTest(name = "semester {0} is rejected")
    @ValueSource(ints = {0, 9, -1})
    void semesterOutsideBoundsRejected(int semester) {
        Student s = valid();
        s.setSemester(semester);
        assertThat(invalidFields(s)).containsExactly("semester");
    }

    @Test
    void nameOf100CharsAcceptedAnd101Rejected() {
        Student s = valid();
        s.setName("a".repeat(100));
        assertThat(invalidFields(s)).isEmpty();
        s.setName("a".repeat(101));
        assertThat(invalidFields(s)).containsExactly("name");
    }

    @ParameterizedTest(name = "name ''{0}'' is rejected")
    @ValueSource(strings = {"", "   "})
    void blankNameRejected(String name) {
        Student s = valid();
        s.setName(name);
        assertThat(invalidFields(s)).containsExactly("name");
    }

    @ParameterizedTest(name = "register number ''{0}'' is accepted")
    @ValueSource(strings = {"ABC", "21CS001", "ABCDEFGHIJ1234567890"})
    void registerNumberLengths3To20Accepted(String regNo) {
        Student s = valid();
        s.setRegisterNumber(regNo);
        assertThat(invalidFields(s)).isEmpty();
    }

    @ParameterizedTest(name = "register number ''{0}'' is rejected")
    @ValueSource(strings = {"AB", "ABCDEFGHIJ12345678901", "21-CS-001", "21 CS", "", "<script>"})
    void invalidRegisterNumbersRejected(String regNo) {
        Student s = valid();
        s.setRegisterNumber(regNo);
        assertThat(invalidFields(s)).containsExactly("registerNumber");
    }

    @Test
    void emailIsOptionalButMustBeValidWhenGiven() {
        Student s = valid();
        s.setEmail(null);
        assertThat(invalidFields(s)).isEmpty();
        s.setEmail("not-an-email");
        assertThat(invalidFields(s)).containsExactly("email");
    }
}
