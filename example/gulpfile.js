'use strict';

var ssg = require('../');
var gulp = require('gulp');
var data = require('gulp-data');
var fm = require('front-matter');
var marked = require('marked');
var fs = require('fs');
var es = require('event-stream');
var hogan = require('hogan.js');

var website = {
    title: 'My site'
};

gulp.task('html', function() {

    // Compile a template for rendering each page
    var template = hogan.compile(String(fs.readFileSync('templates/template.html')));

    return gulp.src('content/**/*.md')

        // Extract YAML, convert content to markdown via gulp-data
        .pipe(data(function(file) {
            var content = fm(String(file.contents));
            file.contents = new Buffer(marked(content.body));
            return content.attributes;
        }))

        // Run through gulp-ssg, copy title from YAML to section
        .pipe(ssg(website, { sectionProperties: ['title'] }))

        // Run each file through a template
        .pipe(es.map(function(file, cb) {
            file.contents = new Buffer(template.render(file));
            cb(null, file);
        }))

        // Output to build directory
        .pipe(gulp.dest('build/'));
});
