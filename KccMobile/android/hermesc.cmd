@echo off
REM hermesc.cmd - Bypass Hermes bytecode compilation on Windows
REM Copies the JS bundle as-is (Hermes can parse plain JS at runtime)
REM Also creates an empty source map file when -output-source-map flag is present
REM Workaround for missing win64-bin hermesc.exe in hermes-compiler@250829098.0.7

setlocal enabledelayedexpansion

set "OUT_FILE="
set "IN_FILE="
set "HAS_SOURCEMAP=0"

:parse_args
if "%~1"=="" goto :do_copy
if "%~1"=="-out" (
    set "OUT_FILE=%~2"
    shift
    shift
    goto :parse_args
)
if "%~1"=="-output-source-map" (
    set "HAS_SOURCEMAP=1"
    shift
    goto :parse_args
)
REM Check if the argument is a file (not a flag starting with -)
echo %~1 | findstr /b /c:"-" >nul 2>&1
if errorlevel 1 (
    set "IN_FILE=%~1"
)
shift
goto :parse_args

:do_copy
if not defined OUT_FILE (
    echo ERROR: -out argument not found
    exit /b 1
)
if not defined IN_FILE (
    echo ERROR: input file not found
    exit /b 1
)

REM Copy JS bundle as-is (no bytecode compilation)
copy /y "%IN_FILE%" "%OUT_FILE%" >nul 2>&1
if errorlevel 1 (
    echo ERROR: Failed to copy %IN_FILE% to %OUT_FILE%
    exit /b 1
)

REM Create empty source map file if -output-source-map was present
if "%HAS_SOURCEMAP%"=="1" (
    echo {"version":3,"sources":[],"mappings":""} > "%OUT_FILE%.map"
)

echo hermesc.cmd: Copied JS bundle as plain source (bytecode compilation skipped)
exit /b 0
