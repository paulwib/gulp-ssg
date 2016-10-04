'use strict';

var through = require('through');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;
var File = gutil.File;

/**
 * Add url, root, parent, siblings and children properties to files, reflecting the structure of
 * the directories. Each property points to other file objects.
 *
 * Values are assigned to the `data` property of each file. Follows `gulp-data` convention so
 * won't override any other data already added to the file.
 *
 * @param array options.baseUrl             The base url of the final website
 * @param array options.sort                The property to sort by
 * @return stream
 */
module.exports = function(options) {
    var buffer = {};
    options = Object.assign({
        baseUrl: '',
        sort: 'url'
    }, options || {});

    // Normalize trailing slash on base URL
    options.baseUrl = options.baseUrl.replace(/\/$/, '') + '/';

    return through(bufferContents, endStream);

    /**
     * Add URL and buffer all files up into an object
     *
     * @param {object} file
     */
    function bufferContents(file) {
        if (file.isNull()) {
            return;
        }
        if (file.isStream()) {
            return this.emit('error', new PluginError('gulp-ssg',  'Streaming not supported'));
        }
        file.data = Object.assign({ url: cleanUrl(file), dirtyUrl: url(file) }, file.data || {});
        buffer[cleanUrl(file)] = file;
    }

    /**
     * Emit file data at end of stream
     */
    function endStream() {
        if (buffer.length === 0) {
            return this.emit('end');
        }
        Object.keys(buffer).forEach(function(url) {
            var file = buffer[url];
            file.data = Object.assign({
                root: buffer[options.baseUrl] || null,
                parent: parent(url),
                children: children(url),
                siblings: siblings(url)
            }, file.data || {});

        }.bind(this));

        Object.keys(buffer).forEach(function(url) {
            this.emit('data', buffer[url]);
        }.bind(this));

        this.emit('end');
    }

    /**
     * Get the parent file for a given URL from the buffer
     *
     * @param {string} url
     */
    function parent(url) {
        if (url === options.baseUrl) {
            return null;
        }
        return buffer[parentUrl(url)] || null;
    }

    function parentUrl(url) {
        return url
            .replace(/\..+$/, '')
            .replace(/\/$/, '')
            .split('/')
            .slice(0, -1)
            .join('/') + '/';
    }

    /**
     * Get the child files for a given URL from the buffer
     *
     * @param {string} url
     */
    function children(url) {
        // Filter to find files with this url as parent
        var ch = filter(new RegExp('^' + url + '[^/]+/?$'));
        sort(ch);

        return ch;
    }

    /**
     * Get the sibling files for a given URL from the buffer
     *
     * @param {string} url
     */
    function siblings(url) {
        if (url === options.baseUrl) {
            return [];
        }
        // Filter to find files with same parent URL
        var sb = filter(new RegExp('^' + parentUrl(url) + '[^/]+/?$'));
        sort(sb);

        return sb;
    }

    /**
     * Generate the URL for the file
     *
     * @param {object} file
     */
    function url(file) {
        return options.baseUrl + file.relative;
    }

    /**
     * Generate a clean URL for the file, without any trailing index.*
     *
     * @param {object} file
     */
    function cleanUrl(file) {
        return url(file).replace(/index\..+$/, '');
    }

    /**
     * Sort an array of files on `options.sort` property of `data`
     *
     * @param {array} files
     */
    function sort(files) {
        if (!options.sort) {
            return;
        }
        files.sort(function(a, b) {
            return a.data[options.sort] >= b.data[options.sort] ? 1 : -1;
        });
    }

    /**
     * Filter buffer to return array of files with URLs matching given regex
     */
    function filter(rx) {
        return Object.keys(buffer).reduce(function(files, val) {
            if (rx.test(val)) {
                files.push(buffer[val]);
            }
            return files;
        }, []);
    }

};
