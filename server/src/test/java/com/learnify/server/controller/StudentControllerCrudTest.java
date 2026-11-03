package com.learnify.server.controller;

import com.learnify.server.config.SecurityConfig;
import com.learnify.server.entity.Role;
import com.learnify.server.entity.Student;
import com.learnify.server.exception.ConflictException;
import com.learnify.server.exception.NotFoundException;
import com.learnify.server.security.JwtService;
import com.learnify.server.security.TestTokens;
import com.learnify.server.service.StudentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Student CRUD through the HTTP layer (TEST_CASES.md: STU-P-*, STU-N-*). */
@WebMvcTest(StudentController.class)
@Import({SecurityConfig.class, JwtService.class})
class StudentControllerCrudTest {

    @Autowired private MockMvc mvc;
    @Autowired private JwtService jwtService;
    @MockitoBean private StudentService studentService;

    private String admin() {
        return TestTokens.bearer(jwtService, Role.ADMIN);
    }

    private static Student student(String id, String name) {
        Student s = new Student(name, "Civil", 2, null);
        s.setId(id);
        s.setRegisterNumber("21CV0" + id.length());
        return s;
    }

    @Test
    void listReturnsAllStudents() throws Exception {
        when(studentService.getAllStudents()).thenReturn(List.of(student("s1", "Asha"), student("s22", "Bala")));

        mvc.perform(get("/api/students").header(HttpHeaders.AUTHORIZATION, admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[1].name").value("Bala"));
    }

    @Test
    void searchParameterUsesSearch() throws Exception {
        when(studentService.searchStudents("asha")).thenReturn(List.of(student("s1", "Asha")));

        mvc.perform(get("/api/students").param("search", "asha").header(HttpHeaders.AUTHORIZATION, admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Asha"));
        verify(studentService, never()).getAllStudents();
    }

    @Test
    void blankSearchFallsBackToFullList() throws Exception {
        when(studentService.getAllStudents()).thenReturn(List.of());

        mvc.perform(get("/api/students").param("search", "   ").header(HttpHeaders.AUTHORIZATION, admin()))
                .andExpect(status().isOk());
        verify(studentService).getAllStudents();
        verify(studentService, never()).searchStudents(any());
    }

    @Test
    void departmentFilterIsApplied() throws Exception {
        when(studentService.getStudentsByDepartment("Civil")).thenReturn(List.of(student("s1", "Asha")));

        mvc.perform(get("/api/students").param("department", "Civil").header(HttpHeaders.AUTHORIZATION, admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void getByIdReturnsStudent() throws Exception {
        when(studentService.getStudentById("s1")).thenReturn(Optional.of(student("s1", "Asha")));

        mvc.perform(get("/api/students/s1").header(HttpHeaders.AUTHORIZATION, admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Asha"));
    }

    @Test
    void getUnknownIdReturns404Json() throws Exception {
        when(studentService.getStudentById("nope")).thenReturn(Optional.empty());

        mvc.perform(get("/api/students/nope").header(HttpHeaders.AUTHORIZATION, admin()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Student not found"));
    }

    @Test
    void duplicateRegisterNumberReturns409() throws Exception {
        when(studentService.addStudent(any())).thenThrow(new ConflictException("Register number 21CS001 is already in use."));

        mvc.perform(post("/api/students").header(HttpHeaders.AUTHORIZATION, admin())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Arun\",\"registerNumber\":\"21CS001\",\"department\":\"Civil\",\"semester\":1}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Register number 21CS001 is already in use."));
    }

    @Test
    void deleteReturnsMessage() throws Exception {
        mvc.perform(delete("/api/students/s1").header(HttpHeaders.AUTHORIZATION, admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Student deleted successfully"));
    }

    @Test
    void deleteUnknownReturns404() throws Exception {
        doThrow(new NotFoundException("Student not found")).when(studentService).deleteStudent("nope");

        mvc.perform(delete("/api/students/nope").header(HttpHeaders.AUTHORIZATION, admin()))
                .andExpect(status().isNotFound());
    }

    @Test
    void semesterAsTextReturns400NotServerError() throws Exception {
        mvc.perform(post("/api/students").header(HttpHeaders.AUTHORIZATION, admin())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Arun\",\"registerNumber\":\"21CS001\",\"department\":\"Civil\",\"semester\":\"three\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void countEndpointWorks() throws Exception {
        when(studentService.getTotalCount()).thenReturn(42L);

        mvc.perform(get("/api/students/count").header(HttpHeaders.AUTHORIZATION, admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(42));
    }
}
