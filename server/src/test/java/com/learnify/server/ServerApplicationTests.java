package com.learnify.server;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
		"spring.mongodb.uri=mongodb://localhost:27017/learnify_test",
		"app.seed.enabled=false",
		"app.demo-data.enabled=false"
})
class ServerApplicationTests {

	@Test
	void contextLoads() {
	}

}
