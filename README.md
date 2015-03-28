[gulp][]-ssg [![NPM version][npm-image]][npm-url] [![Dependency Status][depstat-image]][depstat-url] [![Build Status][travis-image]][travis-url]
===

A [gulp][] plugin to help generate a static website from a bunch of files.

## Installation

```bash
$ npm install gulp-ssg
```

## Usage

```javascript
var ssg = require('gulp-ssg');

gulp.task('html', function() {
    return gulp.src('content/**/*.html')
        .pipe(ssg())
        .pipe(gulp.dest('public/'));
});
```

This will add properties to each file's `data` property:

* `file.data.url` - A URL, which is the `file.relative` with a slash prepended and any trailing `index.html` removed
* `file.data.root` - A pointer to the root file
* `file.data.parent` - A pointer to the parent file
* `file.data.children` - An array of pointers to child files
* `file.data.siblings` - An array of pointers to sibling files

To explain these a bit more:

* The `root` file is the root `index.html` file. If there isn't one then `root` will be `null`.
* The `parent` file is the parent `index.html` file. If there isn't one then `parent` will be `null`.
* The `children` are all the files that have a URL that starts with the current files path plus at least one more token in there path. Because `index.html` is truncated from URLs this means `/foo/bar/` and `/foo/fred.html` are both children of `/foo/index.html`.
* The `siblings` are all the files that have a common parent URL.

This plug-in follows the [gulp-data][] convention of using `file.data`, so anything returned from a `gulp-data` pipe will be merged with the properties above.

## Example

So how can this be used? It gets more interesting when combined with other pipes. For example:

```javascript
var gulp = require('gulp');
var ssg = require('gulp-ssg');
var rename = require('gulp-rename');
var data = require('gulp-data');
var matter = require('gray-matter');
var markdown = require('gulp-markdown');
var wrap = require('gulp-wrap');
var del = require('del');

gulp.task('default', function() {

    return gulp.src('src/content/*.md')

        // Extract YAML front-matter and assign with gulp-data
        .pipe(data(function(file) {
            var m = matter(String(file.contents));
            file.contents = new Buffer(m.content);
            return m.data;
        }))

        // markdown -> HTML
        .pipe(markdown())

        // Rename to .html
        .pipe(rename({ extname: '.html' }))

        // Run through gulp-ssg
        .pipe(ssg())

        // Wrap file in template
        .pipe(wrap(
          { src: 'src/templates/template.html' },
          { siteTitle: 'Example Website'},
          { engine: 'hogan' }
        ))

        // Output to build directory
        .pipe(gulp.dest('public/'));
});
```

There are [complete examples with templates](https://github.com/paulwib/gulp-ssg/tree/master/examples) in the git repo.

## Options

### baseUrl `string`

The base URL of the site, defaults to '/'. This should be the path to where your site will eventually be deployed.

### sort `string`

A property to sort pages by, defaults to `url`. For example, this could be a property like `order` extracted from the YAML front-matter.


[gulp]:http://gulpjs.com
[gulp-data]:https://github.com/colynb/gulp-data

[npm-url]: https://npmjs.org/package/gulp-ssg
[npm-image]: http://img.shields.io/npm/v/gulp-ssg.svg?style=flat

[depstat-url]: https://david-dm.org/paulwib/gulp-ssg
[depstat-image]: https://david-dm.org/paulwib/gulp-ssg.svg?style=flat

[travis-image]: http://img.shields.io/travis/paulwib/gulp-ssg/master.svg?style=flat
[travis-url]: https://travis-ci.org/paulwib/gulp-ssg
