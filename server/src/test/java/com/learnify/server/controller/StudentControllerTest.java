package com.learnify.server.controller;

import com.learnify.server.entity.Student;
import com.learnify.server.exception.NotFoundException;
import com.learnify.server.service.StudentService;
import com.learnify.server.config.SecurityConfig;
import com.learnify.server.entity.Role;
import com.learnify.server.security.JwtService;
import com.learnify.server.security.TestTokens;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(StudentController.class)
@Import({SecurityConfig.class, JwtService.class})
class StudentControllerTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private JwtService jwtService;

    private String admin() {
        return TestTokens.bearer(jwtService, Role.ADMIN);
    }

    @MockitoBean
    private StudentService studentService;

    private static final String VALID_STUDENT = """
            {"name":"Arun Kumar","registerNumber":"21CS001","department":"Computer Science","semester":3,"email":"arun@example.com"}
            """;

    @Test
    void createValidStudentReturns201() throws Exception {
        Student saved = new Student("Arun Kumar", "Computer Science", 3, "arun@example.com");
        saved.setId("s1");
        when(studentService.addStudent(any())).thenReturn(saved);

        mvc.perform(post("/api/students").header(HttpHeaders.AUTHORIZATION, admin()).contentType(MediaType.APPLICATION_JSON).content(VALID_STUDENT))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("s1"));
    }

    @Test
    void createInvalidStudentReturns400WithFieldErrors() throws Exception {
        String invalid = """
                {"name":"","registerNumber":"#1","department":"","semester":12,"email":"not-an-email"}
                """;

        mvc.perform(post("/api/students").header(HttpHeaders.AUTHORIZATION, admin()).contentType(MediaType.APPLICATION_JSON).content(invalid))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.name").exists())
                .andExpect(jsonPath("$.fieldErrors.registerNumber").value("Register number must be 3-20 letters or digits"))
                .andExpect(jsonPath("$.fieldErrors.department").exists())
                .andExpect(jsonPath("$.fieldErrors.semester").value("Semester must be between 1 and 8"))
                .andExpect(jsonPath("$.fieldErrors.email").value("Enter a valid email address"));

        verify(studentService, never()).addStudent(any());
    }

    @Test
    void malformedJsonReturns400() throws Exception {
        mvc.perform(post("/api/students").header(HttpHeaders.AUTHORIZATION, admin()).contentType(MediaType.APPLICATION_JSON).content("{bad json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Request body is missing or malformed."));
    }

    @Test
    void updateMissingStudentReturns404() throws Exception {
        when(studentService.updateStudent(eq("missing"), any()))
                .thenThrow(new NotFoundException("Student not found"));

        mvc.perform(put("/api/students/missing").header(HttpHeaders.AUTHORIZATION, admin()).contentType(MediaType.APPLICATION_JSON).content(VALID_STUDENT))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Student not found"));
    }
}
