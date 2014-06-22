module.exports = (function(Util, Stream) {
	function StreamCache() {
		Stream.call(this);

		this.writable = true;
		this.readable = true;

		this._buffers = [];
		this._dests = [];
		this._ended = false;
	}

	Util.inherits(StreamCache, Stream);

	StreamCache.prototype.write = function(buffer) {
		this._buffers.push(buffer);

		this._dests.forEach(function(dest) {
			dest.write(buffer);
		});
	};

	StreamCache.prototype.pipe = function(dest, options) {
		if (options) {
			throw Error('StreamCache#pipe: options are not supported yet.');
		}

		var self = this,
		bufferCount = this._buffers.length,
		count = 0;

		function write() {
			var ok = true;
			for (count; count < bufferCount; count) {
				if (!ok) break;

				if (count === bufferCount - 1) {
					dest.end(self._buffers[count]);
					break;
				}

				ok = dest.write(self._buffers[count]);
				count++;
			}

			if (!ok) {
				dest.once('drain', write);
			}

			return dest;
		}

		if (this._dests.indexOf(dest) === -1) {
			this._dests.push(dest);
		}

		return write();
	};

	StreamCache.prototype.getLength = function() {
		return this._buffers.reduce(function(totalLength, buffer) {
			return totalLength + buffer.length;
		}, 0);
	};

	StreamCache.prototype.end = function() {
		this._dests.forEach(function(dest) {
			dest.end();
		});

		this._ended = true;
		this._dests = [];
	};

	return StreamCache;
})(require('util'), require('stream').Stream);
