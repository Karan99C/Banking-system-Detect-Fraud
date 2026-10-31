# Upgrade Plan: banking-system (20261031093915)

- **Generated**: 2026-10-31 09:39:15
- **HEAD Branch**: N/A
- **HEAD Commit ID**: N/A

## Available Tools

**JDKs**
- JDK 25: D:\ProgramsUser\Java\jdk-25\jdk-25.0.2 (installed for the upgrade target)
- JDK 17: not available (baseline will be skipped)

**Build Tools**
- Maven 3.9.10: D:\ProgramsUser\Java\apache-maven-3.9.10\bin\mvn
- Maven Wrapper: not present

## Guidelines

> Note: You can add any specific guidelines or constraints for the upgrade process here if needed, bullet points are preferred.

- Upgrade the project Java runtime to the latest LTS release, Java 25.
- Preserve the current Spring Boot 3.x application structure and minimize unnecessary rewrites.
- Keep the build reactor valid by removing non-existent modules that are not part of the checked-in project.

## Options

- Working branch: appmod/java-upgrade-20261031093915
- Run tests before and after the upgrade: true

## Upgrade Goals

- Java 25

## Technology Stack

| Technology/Dependency | Current | Min Compatible Version | Why Incompatible |
| ---------------------- | ------- | --------------------- | --------------- |
| Java | 17 | 25 | User requested Java 25 LTS runtime |
| Spring Boot | 3.3.4 | 3.3.4 | Already on the Spring Boot 3 line; no framework jump required for this upgrade |
| Maven | 3.9.10 | 3.9.10 | Already compatible with Java 25 |
| Lombok | 1.18.34 | 1.18.38 | Older Lombok versions fail to compile on Java 25 |
| MySQL Connector/J | unversioned / wrong coordinates | 8.0.33 | The root reactor was missing the BOM-managed version and the dependency coordinates were incorrect |

## Derived Upgrades

- Upgrade the parent POM from Java 17 to Java 25 and ensure compiler release matches the target runtime.
- Replace the broken reactor mapping so only existing modules are built.
- Update Lombok to a Java 25-compatible patch release.
- Fix MySQL Connector/J to the proper Maven coordinates and BOM-managed version.

## Impact Analysis

### Dependency Changes

| File | Dependency | Current | Action | Target | Reason |
|------|------------|---------|--------|--------|--------|
| pom.xml | reactor modules | includes payment-service and notification-service | remove | existing modules only | These directories do not exist in the repository and prevented the multi-module build from reading any project |
| pom.xml | java.version | 17 | upgrade | 25 | User request to target the latest LTS runtime |
| pom.xml | maven.compiler.source / target | 17 | upgrade | 25 | Align the compiler with the Java 25 runtime |
| pom.xml | lombok.version | 1.18.34 | upgrade | 1.18.38 | Lombok 1.18.34 is not compatible with Java 25 |
| pom.xml | mysql-connector-j | missing / wrong coordinates | add/fix | com.mysql:mysql-connector-j:8.0.33 | The build had no managed MySQL version, and the dependency coordinates were wrong |

### Source Code Changes

| File | Location | Current | Required Change | Reason |
|------|----------|---------|-----------------|--------|
| None | N/A | N/A | No Java source changes required at this stage | The project code is compatible with Java 25 once the build metadata and dependency issues are corrected |

### Configuration Changes

| File | Property/Setting | Current | Required Change | Reason |
|------|------------------|---------|-----------------|--------|
| pom.xml | module list | includes missing services | remove missing modules | Prevents Maven from failing before compilation starts |
| pom.xml | compiler release | 17 | set to 25 | Required for Java 25 target |

### CI/CD Changes

| File | Location | Current | Required Change |
|------|----------|---------|----------------|
| None | N/A | N/A | No CI files in the repo currently pin the Java version |

### Risks & Warnings

- **Broken reactor definition**: The root Maven reactor listed two modules that are not present in the repository. This prevented the project from even evaluating the source tree. **Mitigation**: Remove the nonexistent modules from the parent aggregator and verify the remaining modules compile.
- **Lombok/JDK mismatch**: Java 25 compilation failed because the Lombok annotation processor version was too old for the JDK compiler. **Mitigation**: Upgrade Lombok to a Java 25-compatible version before final validation.
- **MySQL driver resolution**: Maven was resolving the wrong artifact coordinates and had no BOM-managed version for the database driver. **Mitigation**: Use the correct `com.mysql:mysql-connector-j` coordinates and a managed version in the parent POM.

## Upgrade Steps

- Step 1: Setup Environment
  - **Rationale**: The upgrade target is Java 25, so the required JDK must be present before the project can compile and test under the new runtime.
  - **Changes to Make**: Install JDK 25 and verify the toolchain is available for Maven.
  - **Verification**: `java -version` and `mvn -version` under the JDK 25 toolchain; expected: Java 25 active and Maven resolves correctly.

- Step 2: Setup Baseline
  - **Rationale**: The repository does not contain a current JDK installation, so a pre-upgrade baseline cannot be collected from the original runtime without introducing a toolchain mismatch.
  - **Changes to Make**: Skip baseline compilation/tests because the original Java runtime is unavailable.
  - **Verification**: Documented skip with reason: current JDK not installed; no baseline can be captured.

- Step 3: Fix the build reactor and Java 25 compatibility metadata
  - **Rationale**: The project failed before compilation because the reactor listed missing modules and the Java target was still set to 17.
  - **Changes to Make**: Remove nonexistent child modules from the root POM, set Java 25 target values, and add the correct MySQL Connector/J BOM entry.
  - **Verification**: `mvn -q clean test` using Java 25; expected: Maven can read all modules and proceed into compilation.

- Step 4: Upgrade Lombok for JDK 25 compatibility
  - **Rationale**: Compilation under Java 25 failed at the compiler plugin due to an outdated Lombok annotation processor.
  - **Changes to Make**: Raise Lombok to a Java 25-compatible release.
  - **Verification**: `mvn -q clean test` using Java 25; expected: annotation processing succeeds and compilation continues.

- Step 5: Final Validation
  - **Rationale**: Required to confirm the full project compiles and passes tests on Java 25.
  - **Changes to Make**: Resolve any remaining regressions and ensure the whole reactor passes.
  - **Verification**: `mvn -q clean test` with Java 25; expected: build passes with all tests green.
