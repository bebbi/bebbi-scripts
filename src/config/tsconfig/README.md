# What is this tsconfig directory?

These tsconfig.js files get copied to package specifics temporary directories and then are converted to tsconfig.json files from the build script.
The generated tsconfig.json files are then used by the tsc spanwed processes in the build script to build the compiled output(s).

These tsconfig.js files are made to extend the packages tsconfig file.
