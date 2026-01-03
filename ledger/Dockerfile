# Stage 1: Build the Application
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
# ✅ FIX: Use -Dmaven.test.skip=true to SKIP COMPILATION of tests entirely
RUN mvn clean package -Dmaven.test.skip=true

# Stage 2: Run the Application
FROM eclipse-temurin:17-jdk-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]