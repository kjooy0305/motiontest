#!/bin/sh
#
# Gradle start up script for UN*X
#

# Attempt to set APP_HOME
PRG="$0"
while [ -h "$PRG" ] ; do
    ls=$(ls -ld "$PRG")
    link=$(expr "$ls" : '.*-> \(.*\)$')
    if expr "$link" : '/.*' > /dev/null; then
        PRG="$link"
    else
        PRG=$(dirname "$PRG")"/$link"
    fi
done
APP_HOME=$(cd "$(dirname "$PRG")" && pwd)

APP_NAME="Gradle"
APP_BASE_NAME=$(basename "$0")
DEFAULT_JVM_OPTS='"-Xmx64m" "-Xms64m"'

CLASSPATH=$APP_HOME/gradle/wrapper/gradle-wrapper.jar

# Bootstrap: download wrapper jar if missing
if [ ! -f "$CLASSPATH" ]; then
    mkdir -p "$APP_HOME/gradle/wrapper"
    echo "Downloading Gradle wrapper jar..."
    GRADLE_VERSION=8.6
    DIST_URL="https://services.gradle.org/distributions/gradle-${GRADLE_VERSION}-bin.zip"
    TMP_ZIP="/tmp/gradle-wrapper-boot-$$.zip"
    curl -fsSL "$DIST_URL" -o "$TMP_ZIP"
    TMP_DIR="/tmp/gradle-wrapper-boot-$$"
    mkdir -p "$TMP_DIR"
    unzip -q "$TMP_ZIP" -d "$TMP_DIR"
    WRAPPER_JAR=$(find "$TMP_DIR" -name "gradle-wrapper.jar" | head -1)
    if [ -n "$WRAPPER_JAR" ]; then
        cp "$WRAPPER_JAR" "$CLASSPATH"
    else
        # Try extracting from lib folder
        find "$TMP_DIR" -name "*.jar" | grep -i wrapper | head -1 | xargs -I{} cp {} "$CLASSPATH"
    fi
    rm -rf "$TMP_ZIP" "$TMP_DIR"
fi

# Determine the Java command to use
if [ -n "$JAVA_HOME" ]; then
    if [ -x "$JAVA_HOME/jre/sh/java" ]; then
        JAVACMD="$JAVA_HOME/jre/sh/java"
    else
        JAVACMD="$JAVA_HOME/bin/java"
    fi
    if [ ! -x "$JAVACMD" ]; then
        die "ERROR: JAVA_HOME is set to an invalid directory: $JAVA_HOME"
    fi
else
    JAVACMD="java"
    which java > /dev/null 2>&1 || die "ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH."
fi

# Build the command line
exec "$JAVACMD" \
  $DEFAULT_JVM_OPTS \
  $JAVA_OPTS \
  $GRADLE_OPTS \
  "-Dorg.gradle.appname=$APP_BASE_NAME" \
  -classpath "$CLASSPATH" \
  org.gradle.wrapper.GradleWrapperMain \
  "$@"
