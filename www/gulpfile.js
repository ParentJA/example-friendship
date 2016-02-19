var gulp = require("gulp");
var concat = require("gulp-concat");

gulp.task("index", function () {
  // Copy index to dist.
  return gulp.src("./app/src/index.html")
    .pipe(gulp.dest("app/dist/"));
});

gulp.task("app-scripts", function () {
  // Compile scripts and write to dist.
  return gulp.src("./app/src/**/*.js")
    .pipe(concat("./app-scripts.js"))
    .pipe(gulp.dest("./app/dist/"));
});

gulp.task("vendor-scripts", function () {
  // Compile scripts and write to dist.
  return gulp.src([
      "./bower_components/angular/angular.js",
      "./bower_components/angular-cookies/angular-cookies.js",
      "./bower_components/example-accounts/example-accounts.js"
    ])
    .pipe(concat("./vendor-scripts.js"))
    .pipe(gulp.dest("./app/dist/"));
});

gulp.task("default", ["index", "app-scripts", "vendor-scripts"]);