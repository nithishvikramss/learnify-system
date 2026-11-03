package com.learnify.server.entity;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "subjects")
public class Subject {

    @Id
    private String id;

    @NotBlank(message = "Subject name is required")
    @Size(max = 100, message = "Subject name must be at most 100 characters")
    private String name;

    @NotBlank(message = "Subject code is required")
    @Pattern(regexp = "^[A-Za-z0-9-]{2,15}$",
            message = "Code must be 2-15 letters, digits or hyphens")
    private String code;

    @Min(value = 1, message = "Max marks must be between 1 and 200")
    @Max(value = 200, message = "Max marks must be between 1 and 200")
    private int maxMarks;

    public Subject() {}

    public Subject(String name, String code, int maxMarks) {
        this.name = name;
        this.code = code;
        this.maxMarks = maxMarks;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public int getMaxMarks() { return maxMarks; }
    public void setMaxMarks(int maxMarks) { this.maxMarks = maxMarks; }
}
