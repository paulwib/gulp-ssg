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
 * won't override any other data added to the file.
 *
 * The URL will have any trailing `index.html` removed. An additional `baseUrl` can be added.
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
     * @param object file
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
     * At the end of the stream build the website map, sort, then emit the file data.
     * This ensures the full map is built before the next pipe sees the file.
     */
    function endStream() {
        if (buffer.length === 0) {
            return this.emit('end');
        }

        /*if (options.sort) {
            buffer.sort(function(a, b) {
                var aDepth = a.data.url.split('/').length;
                var bDepth = b.data.url.split('/').length;
                if (aDepth < bDepth) {
                    return -1;
                }
                if (bDepth < aDepth) {
                    return 1;
                }
                if (a.isIndex) {
                    return -1;
                }

                return a.data[options.sort] >= b.data[options.sort] ? 1 : -1;
            });
        }*/

        Object.keys(buffer).forEach(function(url) {
            var file = buffer[url];
            file.data = _.extend({
                root: buffer['/'],
                parent: parent(url, buffer),
                children: children(url, buffer),
                siblings: siblings(url, buffer)
            }, file.data || {});
            this.emit('data', file);
        }.bind(this));

        this.emit('end');
    }

    function parent(url, buffer) {
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

    function children(url, buffer) {
        // Do URLs start with same path and not have further path tokens?
        var rx = new RegExp('^' + url + '[^/]+/?$');

        return Object.keys(buffer).reduce(function(ch, val) {
            if (rx.test(val)) {
                ch.push(buffer[val]);
            }
            return ch;
        }, []);
    }

    function siblings(url, buffer) {
        if (url === options.baseUrl) {
            return [];
        }
        return children(parent(url, buffer).data.url, buffer);
    }

    function url(file) {
        return options.baseUrl + file.relative.replace(/index.html$/, '');
    }

};
