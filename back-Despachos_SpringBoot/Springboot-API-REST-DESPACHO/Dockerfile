# syntax=docker/dockerfile:1
# Multi-stage: Maven compila en builder; imagen final solo con JRE, usuario no root.

FROM maven:3.9.9-eclipse-temurin-17-alpine AS builder
WORKDIR /app

COPY pom.xml .
RUN mvn -B -DskipTests dependency:go-offline

COPY src ./src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:17-jre-alpine AS runtime
WORKDIR /app

RUN addgroup -S spring && adduser -S spring -G spring

COPY --from=builder --chown=spring:spring /app/target/*.jar /app/app.jar

USER spring:spring
EXPOSE 8081

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
