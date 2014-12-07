'use strict';

var through = require('through');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;
var File = gutil.File;
var _ = require('lodash');

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
    options = _.extend({
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
        var fileUrl = url(file);
        file.data = _.extend({ url: fileUrl }, file.data || {});
        buffer[fileUrl] = file;
    }

    /**
     * At the end of the stream add the pointers and emit the file data.
     * This ensures the full map is built before the next pipe sees the file.
     */
    function endStream() {
        if (buffer.length === 0) {
            return this.emit('end');
        }

        Object.keys(buffer).forEach(function(url) {
            var file = buffer[url];
            file.data = _.extend({
                root: buffer['/'],
                parent: parent(url),
                children: children(url),
                siblings: siblings(url)
            }, file.data || {});

            this.emit('data', file);

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
        var parentUrl = url
            .replace(/\..+$/, '')
            .replace(/\/$/, '')
            .split('/')
            .slice(0, -1)
            .join('/') + '/';

        return buffer[parentUrl] || null;
    }

    /**
     * Get the child files for a given URL from the buffer
     *
     * @param {string} url
     */
    function children(url) {
        // Do URLs start with same path and not have further path tokens?
        var rx = new RegExp('^' + url + '[^/]+/?$'),
            ch = [];

        ch = Object.keys(buffer).reduce(function(ch, val) {
            if (rx.test(val)) {
                ch.push(buffer[val]);
            }
            return ch;
        }, ch);

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
        return children(parent(url).data.url);
    }

    /**
     * Generate a URL for the file, adding base url and trimming any index.html
     *
     * @param {object} file
     */
    function url(file) {
        return options.baseUrl + file.relative.replace(/index.html$/, '');
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

};
